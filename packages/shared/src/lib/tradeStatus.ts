// 거래상태 코드값 → 한글 라벨.
// 판매요청(REQUEST) 글은 완료·없음일 때 다른 말을 쓴다.
// 오버레이 색·치수는 화면 표현이라 여기 두지 않는다(앱 mobile/lib/tradeStatus.ts).

/**
 * 서버 tradeStatus 코드값 → 사람이 읽는 라벨.
 * @param tradeStatus SELLING / RESERVED / COMPLETED / null
 * @param productType SELL(판매) 또는 REQUEST(판매요청)
 */
export function getTradeLabel(tradeStatus: string | null, productType: string): string {
  const isRequest = productType === 'REQUEST'

  switch (tradeStatus) {
    case 'SELLING':
      return '판매중'
    case 'RESERVED':
      return '예약중'
    case 'COMPLETED':
      return isRequest ? '요청완료' : '판매완료'
    default:
      // null 등: 판매요청이면 "요청중", 그 외는 기본 "판매중"으로 취급.
      return isRequest ? '요청중' : '판매중'
  }
}
