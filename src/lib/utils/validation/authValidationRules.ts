import type { ProfileUpdateBaseFormValues, ProfileUpdatePasswordFormValues } from '@/types/forms'
import type { RegisterOptions } from 'react-hook-form'

export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 30

/** 대문자·소문자·숫자·특수문자를 각각 하나씩은 갖춰야 한다. */
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()]).+$/

/**
 * 비밀번호 조건을 하나씩 따로 알려준다.
 *
 * react-hook-form의 error는 "첫 번째로 걸린 문제" 하나만 준다. 길이를 채우면
 * 그제서야 구성이 모자라다는 걸 알게 되어 사용자가 한 번에 하나씩 더듬어야 한다.
 * 조건을 모두 펼쳐 두면 무엇이 남았는지 바로 보인다.
 *
 * 앱도 같은 함수를 쓴다(mobile/lib/signup/validation.ts의 passwordRules).
 */
export function passwordRules(value: string): { length: boolean; composition: boolean } {
  return {
    length: value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX,
    composition: PASSWORD_PATTERN.test(value),
  }
}

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
      message: '닉네임은 2~10자여야 합니다.',
    },
    maxLength: {
      value: 10,
      message: '닉네임은 2~10자여야 합니다.',
    },
  } satisfies RegisterOptions<ProfileUpdateBaseFormValues, 'nickname'>,

  introduction: {
    minLength: {
      value: 2,
      message: '2자 이상이어야 합니다.',
    },
    maxLength: {
      value: 200,
      message: '자기소개는 200자 이하이어야 합니다.',
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
      value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
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
