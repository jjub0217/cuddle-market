/**
 * 가격에 천 단위 콤마를 붙인다. 단위('원')는 붙이지 않는다.
 * 화면마다 '원'을 붙이는 위치가 달라서(웹은 별도 span) 단위는 호출부가 정한다.
 * 소수점은 버린다. 로케일을 'ko-KR'로 고정해 환경에 따라 결과가 달라지지 않게 한다.
 */
export function formatPrice(price: number): string {
  return Math.floor(price).toLocaleString('ko-KR')
}

/**
 * 거래 가능 여부.
 * tradeStatus가 null이거나 판매중(SELLING)이면 true.
 * (검증된 서버 코드값: SELLING / RESERVED / COMPLETED)
 */
export function isTradeAvailable(tradeStatus: string | null): boolean {
  return tradeStatus === null || tradeStatus === 'SELLING'
}
