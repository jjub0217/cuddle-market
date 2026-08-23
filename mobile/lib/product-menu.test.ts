import { buildOwnerActions, buildStatusActions } from './product-menu';

describe('buildStatusActions — 판매 내역', () => {
  it('판매중이면 예약중 · 판매완료를 보여준다', () => {
    // 지금 상태를 다시 고르게 두면 눌러도 아무 일이 없는 항목이 생긴다.
    expect(buildStatusActions('sales', 'SELLING')).toEqual([
      { label: '예약중으로 변경', next: 'RESERVED' },
      { label: '판매완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('예약중이면 판매중 · 판매완료를 보여준다', () => {
    expect(buildStatusActions('sales', 'RESERVED')).toEqual([
      { label: '판매중으로 변경', next: 'SELLING' },
      { label: '판매완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('판매완료면 상태 변경 항목이 하나도 없다', () => {
    // 완료는 종착역이다. 서버가 허용하더라도 화면에서 열어주지 않는다(설계 §3).
    expect(buildStatusActions('sales', 'COMPLETED')).toEqual([]);
  });
});

// ⚠️ **「요청완료」다. 「구매완료」가 아니다.** 판매요청 내역에 실리는 것은 내가 산 물건이
//    아니라 내가 올린 판매요청 글이라, 공용 `getTradeLabel` 이 정한 「요청완료」를 쓴다.
//    갈래 이름(`purchases`)과 보내는 값(`COMPLETED`)은 서버 것이라 그대로다.
describe('buildStatusActions — 판매요청 내역', () => {
  it('완료 전이면 요청완료만 보여준다', () => {
    expect(buildStatusActions('purchases', 'SELLING')).toEqual([
      { label: '요청완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('요청완료면 상태 변경 항목이 하나도 없다', () => {
    expect(buildStatusActions('purchases', 'COMPLETED')).toEqual([]);
  });
});

describe('buildStatusActions — 값이 이상할 때', () => {
  it('상태가 null이면 판매 내역 전체 목록을 보여준다', () => {
    // 서버가 상태를 안 준 경우. 완료가 아닌 것으로 보고 전부 열어둔다.
    expect(buildStatusActions('sales', null)).toEqual([
      { label: '판매중으로 변경', next: 'SELLING' },
      { label: '예약중으로 변경', next: 'RESERVED' },
      { label: '판매완료로 변경', next: 'COMPLETED' },
    ]);
  });
});

describe('내 상품 ⋮ 전체', () => {
  // 상태 변경만 있던 것에 수정·삭제를 더한다.
  // 완료된 거래도 지울 수는 있어야 한다 — 잘못 올린 것을 못 지우면 갇힌다.

  it('판매중이면 상태 변경 + 수정 + 삭제', () => {
    const actions = buildOwnerActions('sales', 'SELLING');

    expect(actions.map((a) => a.label)).toEqual([
      '예약중으로 변경',
      '판매완료로 변경',
      '수정하기',
      '삭제',
    ]);
  });

  it('완료면 삭제만 남는다', () => {
    // 끝난 거래는 못 고친다(웹과 같다). 다만 지울 수는 있어야 갇히지 않는다
    expect(buildOwnerActions('sales', 'COMPLETED').map((a) => a.label)).toEqual(['삭제']);
  });

  it('삭제는 danger다', () => {
    const actions = buildOwnerActions('sales', 'SELLING');
    const remove = actions.find((a) => a.label === '삭제');

    expect(remove?.tone).toBe('danger');
  });

  it('상태 변경 항목만 next를 들고 있다', () => {
    // 화면이 kind로 갈라 쓴다. 수정·삭제에 next가 붙으면 상태 변경으로 오인될 수 있다.
    const actions = buildOwnerActions('purchases', 'SELLING');

    expect(actions).toEqual([
      { kind: 'status', label: '요청완료로 변경', next: 'COMPLETED' },
      { kind: 'edit', label: '수정하기' },
      { kind: 'delete', label: '삭제', tone: 'danger' },
    ]);
  });
});
