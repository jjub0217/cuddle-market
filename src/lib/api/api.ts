// axios 인스턴스 및 인터셉터 설정
// 모든 API 요청에 자동으로 토큰을 추가하고, 만료 시 갱신하는 로직을 담당

import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/userStore'

// ========== 환경 변수 ==========
// API 서버의 기본 URL을 환경 변수에서 가져옴
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

// ========== Axios 인스턴스 생성 ==========
// 기본 설정이 적용된 axios 인스턴스를 생성
// 이 인스턴스를 사용하면 매번 baseURL, headers 등을 설정할 필요가 없음
export const api = axios.create({
  // 모든 요청의 기본 URL
  baseURL: API_BASE_URL,

  // 쿠키를 포함한 요청을 보낼 때 필요 (refresh token이 쿠키에 저장된 경우)
  withCredentials: true,

  // 기본 헤더 설정
  headers: {
    'Content-Type': 'application/json',
  },
})

// ========== 토큰 갱신 Promise ==========
// 여러 요청이 동시에 401을 받았을 때, 토큰 갱신은 한 번만 실행되어야 함
// 이 변수를 공유하여 중복 갱신을 방지
let tokenRefreshPromise: Promise<string | null> | null = null

// ========== 토큰 갱신 API 호출 ==========
// refresh token(쿠키)을 사용해서 새로운 access token을 발급받음
async function fetchNewAccessToken(): Promise<string | null> {
  try {
    const refreshToken = useUserStore.getState().refreshToken

    if (!refreshToken) {
      throw new Error('No refresh token')
    }
    // refresh token은 쿠키에 저장되어 있으므로 withCredentials: true 필요
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken } // body에 담아서 전송
    )

    // 서버에서 새로운 access token을 응답으로 받음
    const newAccessToken = response.data?.data?.accessToken ?? null

    // zustand store에 새 토큰 저장
    // getState()를 사용하면 React 컴포넌트 외부에서도 store에 접근 가능
    useUserStore.getState().setAccessToken(newAccessToken)

    // 새 토큰 반환
    return newAccessToken
  } catch {
    // 토큰 갱신 실패 (refresh token도 만료된 경우)
    // 사용자 정보 초기화 (로그아웃 처리)
    useUserStore.getState().clearAll()

    // 로그인 페이지로 리다이렉트
    window.location.href = '/auth/login'

    return null
  }
}

// ========== 토큰 갱신 요청 (중복 방지) ==========
// 이미 토큰 갱신 중이면 기존 Promise를 반환하고,
// 아니면 새로운 갱신 요청을 시작
async function refreshAccessToken(): Promise<string | null> {
  // 이미 토큰 갱신 중인 경우 → 기존 Promise 반환 (중복 갱신 방지)
  if (!tokenRefreshPromise) {
    // 토큰 갱신 시작, Promise 저장
    tokenRefreshPromise = fetchNewAccessToken().finally(() => {
      // 갱신 완료 후 Promise 초기화 (다음 갱신 요청을 위해)
      tokenRefreshPromise = null
    })
  }

  // 같은 Promise를 반환 → 모든 대기 중인 요청이 같은 결과를 받음
  return tokenRefreshPromise
}

// ========== 요청 인터셉터 (Request Interceptor) ==========
// 모든 요청이 서버로 전송되기 전에 실행되는 함수
// 주로 인증 토큰을 헤더에 추가하는 용도로 사용
api.interceptors.request.use(
  // 성공 핸들러: 요청 설정을 수정할 수 있음
  (config) => {
    // zustand store에서 현재 access token을 가져옴
    const accessToken = useUserStore.getState().accessToken

    // 토큰이 존재하면 Authorization 헤더에 추가
    // Bearer 스킴: OAuth 2.0에서 사용하는 표준 인증 방식
    if (accessToken) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    // FormData 전송 시 Content-Type을 삭제하여 axios가 자동으로 multipart/form-data 설정하도록 함
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // 수정된 config를 반환 (필수!)
    return config
  },

  // 에러 핸들러: 요청 설정 중 에러가 발생한 경우
  (error) => Promise.reject(error)
)

// ========== 응답 인터셉터 (Response Interceptor) ==========
// 서버로부터 응답을 받은 후 실행되는 함수
// 401/302 에러(인증 실패) 발생 시 토큰 갱신을 시도
api.interceptors.response.use(
  // 성공 핸들러: 2xx 상태 코드인 경우 → 응답을 그대로 반환
  (response) => response,

  // 에러 핸들러: 2xx 외의 상태 코드인 경우
  async (error: AxiosError) => {
    // 원래 요청 설정을 가져옴
    // _retry: 이 요청이 이미 재시도된 것인지 확인하는 커스텀 플래그
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined

    const status = error.response?.status

    // 401 또는 302 에러이고, 원래 요청이 있고, 아직 재시도하지 않은 경우
    // 401 = Unauthorized (인증 실패, 주로 토큰 만료)
    // 302 = 리다이렉트 (서버가 인증 실패 시 로그인 페이지로 리다이렉트하는 경우)
    if ((status === 401 || status === 302) && originalRequest && !originalRequest._retry) {
      // 재시도 플래그 설정 (무한 루프 방지)
      originalRequest._retry = true

      // 토큰 갱신 시도 (이미 갱신 중이면 기존 Promise 사용)
      const newToken = await refreshAccessToken()

      // 새 토큰을 받았으면 원래 요청 재실행
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
    }

    // 401/302 외의 에러 또는 토큰 갱신 실패 시 에러 전달
    return Promise.reject(error)
  }
)

// ========== 사용 예시 ==========
// import { api } from '@/lib/api/axiosInstance'
//
// // GET 요청
// const response = await api.get('/products/123')
//
// // POST 요청
// const response = await api.post('/likes', { product_id: 123 })
//
// // 자동으로 처리되는 것들:
// // 1. Authorization 헤더에 access token 추가
// // 2. 401 에러 시 토큰 갱신 후 재요청
// // 3. refresh token도 만료 시 로그아웃 처리
