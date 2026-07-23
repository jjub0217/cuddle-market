// 거래상태(tradeStatus) 코드값 → 라벨/오버레이 매핑.
// 근거: 요구사항 §4.1, UI 스펙 §5. 순수 함수라 나중에 @cuddle/shared로 승격 후보.

/** 썸네일 위에 덮는 오버레이 스펙. null이면 오버레이 없음. */
export interface TradeOverlay {
  /** 스크림(어두운 막) 색. 예약중=0.40, 완료계열=0.60 */
  scrim: string
  /** 중앙 흰 pill에 넣는 상태 글자 */
  label: string
}

/**
 * 서버 tradeStatus 코드값 → 사람이 읽는 라벨.
 * 판매요청 상품(productType='REQUEST')은 완료/없음일 때 예외 라벨을 쓴다.
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

/**
 * 거래상태에 따른 썸네일 오버레이 규칙(UI 스펙 §5).
 * - 판매중 / 요청중 → null (오버레이 없음)
 * - 예약중 → 스크림 0.40 + 흰 pill "예약중"
 * - 완료 계열(판매완료·요청완료) → 스크림 0.60 + 흰 pill(라벨)
 */
export function getOverlay(tradeStatus: string | null, productType: string): TradeOverlay | null {
  switch (tradeStatus) {
    case 'RESERVED':
      return { scrim: 'rgba(0, 0, 0, 0.40)', label: '예약중' }
    case 'COMPLETED':
      return { scrim: 'rgba(0, 0, 0, 0.60)', label: getTradeLabel(tradeStatus, productType) }
    default:
      // SELLING, null(요청중) 등 → 오버레이 없음.
      return null
  }
}
