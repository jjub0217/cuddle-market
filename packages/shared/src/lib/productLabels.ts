// 상품 타입·상태 코드값 → 한글 라벨.
// 근거: 웹 constants.ts의 PRODUCT_TYPE_TABS, CONDITION_ITEMS.

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SELL: '판매',
  REQUEST: '판매요청',
}

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  NEW: '새 상품',
  LIKE_NEW: '거의 새것',
  USED: '사용감 있음',
  NEED_REPAIR: '수리 필요',
}

/** 상품 타입 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getProductTypeLabel(code: string): string {
  return PRODUCT_TYPE_LABELS[code] ?? code
}

/** 상품 상태 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getProductStatusLabel(code: string): string {
  return PRODUCT_STATUS_LABELS[code] ?? code
}
