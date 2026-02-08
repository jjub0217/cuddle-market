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
