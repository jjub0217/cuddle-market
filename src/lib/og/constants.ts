export const OG_SIZE = { width: 1200, height: 630 }

export const OG_COLORS = {
  primary: '#315a98',
  background: '#ffffff',
  backgroundLight: '#f0f4ff',
  textPrimary: '#171923',
  textSecondary: '#718096',
  white: '#ffffff',
} as const

export const TRADE_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  SELLING: { label: '판매중', color: '#48bb78' },
  RESERVED: { label: '예약중', color: '#ed8936' },
  SOLD_OUT: { label: '판매완료', color: '#a0aec0' },
}

export const BOARD_TYPE_STYLE: Record<string, { label: string; color: string }> = {
  QUESTION: { label: '질문 있어요', color: '#4299e1' },
  INFO: { label: '정보 공유', color: '#48bb78' },
}
