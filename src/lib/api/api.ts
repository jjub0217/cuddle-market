// axios 인스턴스 및 인터셉터 설정
// 모든 API 요청에 자동으로 토큰을 추가하고, 만료 시 갱신하는 로직을 담당

import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/userStore'

// ========== 환경 변수 ==========
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

// ========== Axios 인스턴스 생성 ==========
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ========== 토큰 갱신 Promise ==========
let tokenRefreshPromise: Promise<string | null> | null = null

// ========== 토큰 갱신 API 호출 ==========
async function fetchNewAccessToken(): Promise<string | null> {
  try {
    const refreshToken = useUserStore.getState().refreshToken

    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })

    const newAccessToken = response.data?.data?.accessToken ?? null
    const newRefreshToken = response.data?.data?.refreshToken ?? null

    useUserStore.getState().setAccessToken(newAccessToken)

    // 서버는 갱신할 때마다 Refresh Token을 새로 발급하고 옛 것을 블랙리스트에 넣는다(1회용).
    // 새 것을 받아두지 않으면 다음 갱신이 "이미 로그아웃된 Refresh Token"으로 반드시 실패한다.
    // 서버가 안 줄 때는 쓰던 것을 그대로 둔다 — 지우면 다음 갱신 기회까지 잃는다.
    if (newRefreshToken) {
      useUserStore.getState().setRefreshToken(newRefreshToken)
    }

    return newAccessToken
  } catch {
    useUserStore.getState().clearAll()

    if (typeof window !== 'undefined') {
      window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/auth/login'
    }

    return null
  }
}

// ========== 토큰 갱신 요청 (중복 방지) ==========
async function refreshAccessToken(): Promise<string | null> {
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = fetchNewAccessToken().finally(() => {
      tokenRefreshPromise = null
    })
  }

  return tokenRefreshPromise
}

// ========== 요청 인터셉터 ==========
api.interceptors.request.use(
  (config) => {
    const accessToken = useUserStore.getState().accessToken

    if (accessToken) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ========== 응답 인터셉터 ==========
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined

    const status = error.response?.status

    if ((status === 401 || status === 302) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const newToken = await refreshAccessToken()

      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  },
)
