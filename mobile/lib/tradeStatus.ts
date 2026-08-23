import { getTradeLabel } from '@cuddle/shared'

// 거래상태에 따른 썸네일/이미지 오버레이 규칙(UI 스펙 §5).
// 라벨 자체는 @cuddle/shared로 옮겼고, 여기에는 화면 표현(색·구성)만 남긴다.

/** 이미지 위에 덮는 오버레이 스펙. null이면 오버레이 없음. */
export interface TradeOverlay {
  /** 스크림(어두운 막) 색. 예약중=0.40, 완료계열=0.60 */
  scrim: string
  /** 중앙 흰 pill에 넣는 상태 글자 */
  label: string
}

/**
 * 거래상태에 따른 오버레이 규칙(UI 스펙 §5).
 * - 판매중 / 요청중 → null (오버레이 없음)
 * - 예약중 → 스크림 0.40 + 흰 pill "예약중"
 * - 완료 계열(판매완료·요청완료) → 스크림 0.60 + 흰 pill(라벨)
 */
export function getOverlay(tradeStatus: string | null, productType: string): TradeOverlay | null {
  switch (tradeStatus) {
    case 'RESERVED':
      // ⚠️ **예약중도 `getTradeLabel` 에 맡긴다.** 지금은 `productType` 과 무관하게 늘 「예약중」이라
      //    여기에 직접 적어도 결과가 같지만, 라벨을 공용 함수에 맡겨 두면 **나중에 판매요청 쪽
      //    문구가 갈려도 여기가 저절로 따라온다.** 웹도 같은 까닭으로 옮겼다(#1038 —
      //    `ChatProductCard.tsx` 의 `getOverlay`). 문구를 두 곳에서 정하지 않는 것이 요점이다.
      return { scrim: 'rgba(0, 0, 0, 0.40)', label: getTradeLabel(tradeStatus, productType) }
    case 'COMPLETED':
      return { scrim: 'rgba(0, 0, 0, 0.60)', label: getTradeLabel(tradeStatus, productType) }
    default:
      // SELLING, null(요청중) 등 → 오버레이 없음.
      return null
  }
}
