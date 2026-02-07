/**
 * 폼 관련 타입 정의
 */

// 커뮤니티 게시글 폼 타입
export interface CommunityPostFormValues {
  title: string
  content: string
  boardType: string
  images?: File[]
}

// 프로필 수정 기본 폼 타입
export interface ProfileUpdateBaseFormValues {
  nickname: string
  introduction: string
  addressSido: string
  addressGugun: string
  profileImage?: File
}

// 프로필 비밀번호 수정 폼 타입
export interface ProfileUpdatePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
