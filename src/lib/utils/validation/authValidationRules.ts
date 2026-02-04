import type { ProfileUpdateBaseFormValues, ProfileUpdatePasswordFormValues } from '@/types/forms'
import type { RegisterOptions } from 'react-hook-form'

/**
 * 인증 관련 폼(로그인, 회원가입)에서 공통으로 사용되는 validation 규칙
 */
export const authValidationRules = {
  email: {
    required: '이메일을 입력해주세요',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '이메일 형식이 올바르지 않습니다',
    },
  } satisfies RegisterOptions,

  password: {
    required: '비밀번호를 입력해주세요',
    minLength: {
      value: 10,
      message: '비밀번호는 최소 10자 이상이어야 합니다',
    },
    maxLength: {
      value: 30,
      message: '비밀번호는 최대 30자까지 가능합니다',
    },
    pattern: {
      value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()]).+$/,
      message: '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다',
    },
  } satisfies RegisterOptions,
  emailCode: {
    required: '전송된 코드를 입력해주세요',
  } satisfies RegisterOptions,
} as const

export const profileValidationRules = {
  nickname: {
    minLength: {
      value: 2,
      message: '닉네임은 2~ 10자 이상이어야 합니다.',
    },
    maxLength: {
      value: 10,
      message: '닉네임은 2~ 10자 이상이어야 합니다.',
    },
  } satisfies RegisterOptions<ProfileUpdateBaseFormValues, 'nickname'>,
  introduction: {
    minLength: {
      value: 2,
      message: '자기소개는 2~ 100자 이하이어야 합니다.',
    },
    maxLength: {
      value: 1000,
      message: '자기소개는 2~ 1000자 이하이어야 합니다.',
    },
  } satisfies RegisterOptions<ProfileUpdateBaseFormValues, 'introduction'>,

  currentPassword: {
    required: '비밀번호를 입력해주세요',
    minLength: {
      value: 10,
      message: '비밀번호는 최소 10자 이상이어야 합니다',
    },
    maxLength: {
      value: 30,
      message: '비밀번호는 최대 30자까지 가능합니다',
    },
    pattern: {
      value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()]).+$/,
      message: '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다',
    },
  } satisfies RegisterOptions,
  newPassword: {
    required: '비밀번호를 입력해주세요',
    minLength: {
      value: 10,
      message: '비밀번호는 최소 10자 이상이어야 합니다',
    },
    maxLength: {
      value: 30,
      message: '비밀번호는 최대 30자까지 가능합니다',
    },
    pattern: {
      value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()]).+$/,
      message: '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다',
    },
  } satisfies RegisterOptions,

  confirmPassword: (password: string) =>
    ({
      required: '비밀번호 확인을 입력해주세요',
      validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
    }) satisfies RegisterOptions<ProfileUpdatePasswordFormValues, 'confirmPassword'>,
} as const
