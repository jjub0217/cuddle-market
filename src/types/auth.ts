import type { Province } from '@/constants/cities'
import type { User } from './user'

// ========== 인증 관련 타입 ==========
export interface NicknameCheckResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: boolean // true: 사용 가능, false: 중복
}

/**
 * 이메일을 쓸 수 있는지 묻는 응답.
 *
 * 서버는 `SuccessResponse<Boolean>`을 준다 (AuthController.checkEmail).
 * 예전에는 아래 EmailCheckResponse(data: string) 하나를 셋이 같이 썼는데,
 * 이것만 boolean이라 타입이 거짓말을 하고 있었다. 화면이 `if (!data)`로
 * 참/거짓을 보고 있어 동작은 맞았고, 그래서 아무도 몰랐다.
 * (2026-08-01, 시험을 쓰다가 드러났다 — #799)
 */
export interface EmailAvailabilityResponse {
  code: string
  message: string
  /** true=쓸 수 있다, false=이미 가입된 이메일 */
  data: boolean
}

/**
 * 인증코드 발송·확인 응답.
 * 서버는 `SuccessResponse<String>`을 준다 (sendVerificationCode · verifyVerificationCode).
 */
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
  /**
   * 필수 동의 둘(#1088). 서버가 이 값을 보고 동의 시각과 약관 판을 스스로 찍는다.
   *
   * ⚠️ 시각·판을 화면에서 만들어 보내지 않는다. 보내면 바꿔치기할 수 있고,
   *    배포 시차로 화면이 아는 판과 서버가 가진 판이 어긋난다.
   *    화면은 「동의했다」만 말하고, 무엇에 언제 동의했는지는 서버가 적는다.
   */
  termsAgreed: boolean
  privacyAgreed: boolean
}

export interface SocialSignUpRequestData {
  nickname?: string
  birthDate: string
  addressSido: Province | ''
  addressGugun: string
  /** 소셜 가입도 같은 이용계약이라 똑같이 받는다. 위 주석 참고. */
  termsAgreed: boolean
  privacyAgreed: boolean
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
    user: User
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
