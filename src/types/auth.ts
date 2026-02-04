import type { Province } from '@/constants/cities'

// ========== 인증 관련 타입 ==========
export interface NicknameCheckResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: boolean // true: 사용 가능, false: 중복
}

export interface EmailCheckResponse {
  code: string
  message: string
  data: string
}

export interface SignUpRequestData {
  email?: string
  password?: string
  name?: string
  nickname?: string
  birthDate: string
  addressSido: Province | ''
  addressGugun: string
}

export interface SocialSignUpRequestData {
  nickname?: string
  birthDate: string
  addressSido: Province | ''
  addressGugun: string
}

export interface SignUpResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: {
    id: number
    email: string
    name: string
    nickname: string
    birthDate: string
    addressSido: string
    addressGugun: string
  }
}

export interface LoginRequestData {
  email?: string
  password: string
}

export interface LoginResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: {
    accessToken: string
    refreshToken: string
    user: {
      id: number
      email: string
      name: string
      nickname: string
      birthDate: string
      addressSido: string
      addressGugun: string
    }
  }
}

export interface ResettingPasswordResponse {
  code: string
  message: string
  data: string
}

export interface ResettingPasswordRequestData {
  email: string
  newPassword: string
  confirmPassword: string
}

// ========== 회원탈퇴 요청 타입 ==========
export interface WithDrawRequest {
  reason: string
  detailReason: string
}

export interface WithDrawResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: string
}
