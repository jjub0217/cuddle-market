import type {
  NicknameCheckResponse,
  EmailAvailabilityResponse,
  EmailCheckResponse,
  SignUpRequestData,
  SignUpResponse,
  LoginRequestData,
  LoginResponse,
} from '@/types'
import axios from 'axios'
import { api } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export const checkNickname = async (nickname: string): Promise<NicknameCheckResponse> => {
  const response = await axios.get(`${API_BASE_URL}/auth/nickname/check`, {
    params: { nickname },
  })
  return response.data
}

export const checkEmail = async (email: string): Promise<EmailAvailabilityResponse> => {
  const response = await axios.get(`${API_BASE_URL}/auth/email/check?email=${email}`)
  return response.data
}

export const sendEmailValidCode = async (email: string): Promise<EmailCheckResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/email/verification/send`, { email })
  return response.data
}

export const checkEmailValidCode = async (email: string, code: string): Promise<EmailCheckResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/email/verification/verify`, { email, verificationCode: code })
  return response.data
}

/**
 * 계정 찾기 — 「어떻게 가입했는지」를 메일로 보내 달라고 서버에 부탁한다(#849).
 *
 * ⚠️ **돌려주는 값이 없다.** 일부러 그렇게 뒀다. 서버가 무엇을 답하든 화면은 같은
 *    말을 해야 하므로(계정 열거 방지), 부르는 쪽이 응답을 들여다볼 여지를 아예 없앤다.
 *    `sendValidCode` 처럼 `response.data` 를 돌려주면 언젠가 누군가 그것을 화면에 뿌린다.
 *
 * ⚠️ 서버 엔드포인트는 **아직 없다**(2026-08-25 기준). 붙일 곳은
 *    `POST /api/auth/account/find` 로 잡아 뒀다 — 명세는
 *    `docs/superpowers/specs/2026-08-25-account-enumeration-design.md` §5-5 에 있다.
 */
export const findAccount = async (email: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/account/find`, { email })
}

export const signup = async (requestData: SignUpRequestData): Promise<SignUpResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, requestData)
  return response.data
}

export const login = async (requestData: LoginRequestData): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, requestData, {
    withCredentials: true,
  })
  return response.data
}

export const logout = async (): Promise<void> => {
  const response = await api.post(`/auth/logout`)
  return response.data
}
