import type { TradeStatus } from './product-actions';

// 하단 시트에 어떤 상태 변경 항목을 보일지 정한다.
//
// 화면에서 떼어 순수 함수로 둔 이유:
// 조건이 얽혀 있고(목록 종류 × 현재 상태), 특히 "완료 뒤에는 못 바꾼다"가 어긋나면
// 끝난 거래를 되돌리게 된다. 화면 없이 테스트할 수 있어야 한다.

/** 어느 목록에서 열었는가. 판매와 구매는 고를 수 있는 상태가 다르다. */
export type MenuKind = 'sales' | 'purchases';

export interface StatusAction {
  /** 시트에 그릴 문구. "판매중"이 아니라 "판매중으로 변경" — 지금 상태 표시와 헷갈리지 않게. */
  label: string;
  next: TradeStatus;
}

const SALES_ACTIONS: StatusAction[] = [
  { label: '판매중으로 변경', next: 'SELLING' },
  { label: '예약중으로 변경', next: 'RESERVED' },
  { label: '판매완료로 변경', next: 'COMPLETED' },
];

/**
 * @param current 서버가 준 지금 상태. `@cuddle/shared`의 타입이 `string | null`이라 넓게 받는다.
 */
export function buildStatusActions(kind: MenuKind, current: string | null): StatusAction[] {
  // 완료는 종착역이다(설계 §3). 웹도 isCompleted면 상태 변경 항목을 전부 감춘다.
  if (current === 'COMPLETED') return [];

  if (kind === 'purchases') {
    return [{ label: '구매완료로 변경', next: 'COMPLETED' }];
  }

  // 지금 상태를 다시 고르게 두면 눌러도 아무 일이 없는 항목이 생긴다.
  return SALES_ACTIONS.filter((action) => action.next !== current);
}
