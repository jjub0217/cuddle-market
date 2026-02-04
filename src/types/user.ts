// ========== 유저 관련 타입 ==========
export interface User {
  id: number
  email?: string
  name: string
  nickname: string
  birthDate: string
  profile_completed?: boolean
  addressSido: string
  addressGugun: string
  profileImageUrl?: string
  introduction?: string
  createdAt?: string
}

// ========== 마이페이지 관련 타입 ==========
export interface MyPageDataResponse {
  code: {
    code: 200
    message: string
  }
  message: string
  data: {
    id: number
    profileImageUrl: string
    nickname: string
    name: string
    introduction: string
    birthDate: string
    email: string
    addressSido: string
    addressGugun: string
    createdAt: string
  }
}

export interface BlockedUser {
  blockedUserId: number
  nickname: string
  profileImageUrl: string
}

export interface MyBlockedUsersResponse {
  code: { code: number; message: string }
  message: string
  data: {
    blockedUsers: {
      page: number
      size: number
      total: number
      content: BlockedUser[]
      totalPages: number
      hasNext: boolean
      hasPrevious: boolean
      totalElements: number
      numberOfElements: number
    }
  }
}

// ========== 프로필 수정 요청 타입 ==========
export interface ProfileUpdateRequestData {
  nickname?: string
  birthDate?: string
  addressSido?: string
  addressGugun?: string
  profileImageUrl?: string
  introduction?: string
}

export interface ProfileUpdateResponse {
  code: string
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

export interface ChangePasswordRequestData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: string
}

// ========== 유저 프로필 데이터 응답 타입 ==========
export interface UserProfileResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: {
    id: number
    profileImageUrl: string
    addressSido: string
    addressGugun: string
    nickname: string
    createdAt: string
    introduction: string
    isBlocked: boolean
    isReported: boolean
  }
}

export interface UserBlockedResponse {
  code: string
  message: string
  data: {
    blockerId: 1
    blockedUserId: 123
    blockedNickname: string
    blockedProfileImageUrl: string
    createdAt: string
  }
}

export interface UserUnBlockedResponse {
  code: string
  message: string
  data: null
}

export interface ReportedRequestData {
  reasonCode: string
  detailReason?: string
  imageFiles?: string[]
}

export interface ReportedResponse {
  code: string
  message: string
  data: {
    id: 1
    reporterId: 1
    targetType: string
    targetId: 123
    reasonCodes: string[]
    detailReason: string
    imageUrls: string[]
    status: string
    createdAt: string
  }
}
