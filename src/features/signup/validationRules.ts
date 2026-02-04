import type { RegisterOptions } from 'react-hook-form'
import type { SignUpFormValues } from './components/SignUpForm'
import type { ProductPostFormValues } from '../product-post/components/ProductPostForm'

/**
 * 회원가입 폼 전용 validation 규칙
 */
export const signupValidationRules = {
  name: {
    required: '이름을 입력해주세요',
    minLength: {
      value: 2,
      message: '이름은 2~ 10자 이하이어야 합니다.',
    },
    maxLength: {
      value: 10,
      message: '이름은 2~ 10자 이하이어야 합니다.',
    },
  } satisfies RegisterOptions<SignUpFormValues, 'name'>,

  nickname: {
    required: '닉네임을 입력해주세요',
    minLength: {
      value: 2,
      message: '닉네임은 2~ 10자 이하이어야 합니다.',
    },
    maxLength: {
      value: 10,
      message: '닉네임은 2~ 10자 이하이어야 합니다.',
    },
  } satisfies RegisterOptions<SignUpFormValues, 'nickname'>,

  passwordConfirm: (password: string) =>
    ({
      required: '비밀번호 확인을 입력해주세요',
      validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
    }) satisfies RegisterOptions<SignUpFormValues, 'passwordConfirm'>,

  addressSido: {
    required: '지역을 선택해주세요',
  } satisfies RegisterOptions<SignUpFormValues, 'addressSido'>,

  addressGugun: {
    required: '지역을 선택해주세요',
  } satisfies RegisterOptions<SignUpFormValues, 'addressGugun'>,
} as const

// 공통 제목 필드 validation 규칙
export const commonTitleValidationRules = {
  required: '제목을 입력해주세요',
  minLength: {
    value: 2,
    message: '제목은 2~50자여야 합니다.',
  },
  maxLength: {
    value: 50,
    message: '제목은 2~50자여야 합니다.',
  },
}

// 커뮤니티 내용 필드 validation 규칙
export const communityContentValidationRules = {
  required: '내용을 입력하세요',
  minLength: {
    value: 2,
    message: '내용은 2~1000자여야 합니다.',
  },
  maxLength: {
    value: 1000,
    message: '내용은 2~1000자여야 합니다.',
  },
}

export const productPostValidationRules = {
  name: {
    required: '상품명을 입력해주세요',
    minLength: {
      value: 2,
      message: '상품명은 2~ 50자 이하이어야 합니다.',
    },
    maxLength: {
      value: 50,
      message: '상품명은 2~ 50자 이하이어야 합니다.',
    },
  } satisfies RegisterOptions<ProductPostFormValues, 'title'>,

  description: {
    required: '상품설명을 입력해주세요',
    minLength: {
      value: 2,
      message: '상품설명은 2 ~ 1000자 이하이어야 합니다.',
    },
    maxLength: {
      value: 1000,
      message: '상품설명은 2 ~ 1000자 이하이어야 합니다.',
    },
  } satisfies RegisterOptions<ProductPostFormValues, 'description'>,

  price: {
    required: '가격을 입력해주세요',
    min: {
      value: 0,
      message: '가격은 0원 이상이어야 합니다',
    },
  } satisfies RegisterOptions<ProductPostFormValues, 'price'>,

  addressGugun: {
    required: '지역을 선택해주세요',
  } satisfies RegisterOptions<SignUpFormValues, 'addressGugun'>,
} as const

export const productPostApiErrors = {
  imageUpload: {
    INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
    FILE_SIZE_EXCEEDED: '파일 크기는 5MB를 초과할 수 없습니다.',
    INTERNAL_SERVER_ERROR: '이미지 업로드에 실패했습니다.',
  },
} as const

export const WithDrawApiErrors = {
  detailReason: {
    required: '상세 사유를 입력해주세요',
    minLength: {
      value: 2,
      message: '상세사유는 2 ~ 500자 이하이어야 합니다.',
    },
    maxLength: {
      value: 500,
      message: '상세사유는 2 ~ 500자 이하이어야 합니다.',
    },
  },
} as const

export const ReportApiErrors = {
  detailReason: {
    maxLength: {
      value: 300,
      message: '상세사유는 2 ~ 300자 이하이어야 합니다.',
    },
  },
} as const
