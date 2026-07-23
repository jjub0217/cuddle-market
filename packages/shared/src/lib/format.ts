/** 가격을 "1,000원" 형태로 포맷한다. */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`
}

/**
 * 거래 가능 여부.
 * tradeStatus가 null이거나 판매중(SELLING)이면 true.
 * (검증된 서버 코드값: SELLING / RESERVED / COMPLETED)
 */
export function isTradeAvailable(tradeStatus: string | null): boolean {
  return tradeStatus === null || tradeStatus === 'SELLING'
}
