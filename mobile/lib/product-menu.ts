import type { TradeStatus } from './product-actions';

// 하단 시트에 어떤 상태 변경 항목을 보일지 정한다.
//
// 화면에서 떼어 순수 함수로 둔 이유:
// 조건이 얽혀 있고(목록 종류 × 현재 상태), 특히 "완료 뒤에는 못 바꾼다"가 어긋나면
// 끝난 거래를 되돌리게 된다. 화면 없이 테스트할 수 있어야 한다.

/** 어느 목록에서 열었는가. 판매 내역과 판매요청 내역은 고를 수 있는 상태가 다르다. */
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
    // ⚠️ **「요청완료」다. 「구매완료」가 아니다.** 여기 실리는 것은 내가 산 물건이 아니라
    //    내가 올린 **판매요청 글**이다. 공용 `getTradeLabel`(packages/shared)도 REQUEST 에는
    //    「요청완료」를 돌려준다 — 그 말과 어긋나면 목록의 뱃지와 메뉴 항목이 따로 논다.
    //    ⚠️ 보내는 값(`COMPLETED`)과 갈래 이름(`purchases`)은 서버 쪽이라 그대로 둔다.
    return [{ label: '요청완료로 변경', next: 'COMPLETED' }];
  }

  // 지금 상태를 다시 고르게 두면 눌러도 아무 일이 없는 항목이 생긴다.
  return SALES_ACTIONS.filter((action) => action.next !== current);
}

/** ⋮ 항목이 무엇을 하는 것인지. 화면이 이걸 보고 무슨 일을 할지 고른다. */
export type OwnerActionKind = 'status' | 'edit' | 'delete';

export interface OwnerAction {
  kind: OwnerActionKind;
  label: string;
  /** 상태 변경일 때만 있다 */
  next?: TradeStatus;
  tone?: 'default' | 'danger';
}

/**
 * 내 상품 ⋮ 에 보일 것 전부.
 *
 * ⚠️ 완료된 거래도 **지울 수는 있다.** 상태 변경과 수정만 막는다 —
 *    잘못 올린 것을 못 지우면 갇힌다.
 */
export function buildOwnerActions(kind: MenuKind, current: string | null): OwnerAction[] {
  const isCompleted = current === 'COMPLETED';

  return [
    ...buildStatusActions(kind, current).map((action) => ({
      kind: 'status' as const,
      label: action.label,
      next: action.next,
    })),
    // 끝난 거래는 못 고친다 — 샀던 사람이 본 내용과 달라진다 (웹 MyList와 같은 규칙).
    // 지우는 것은 남긴다. 잘못 올린 것을 못 지우면 갇힌다.
    ...(isCompleted ? [] : [{ kind: 'edit' as const, label: '수정하기' }]),
    { kind: 'delete' as const, label: '삭제', tone: 'danger' as const },
  ];
}
