import { buildStatusActions } from './product-menu';

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

describe('buildStatusActions — 구매 내역', () => {
  it('완료 전이면 구매완료만 보여준다', () => {
    expect(buildStatusActions('purchases', 'SELLING')).toEqual([
      { label: '구매완료로 변경', next: 'COMPLETED' },
    ]);
  });

  it('구매완료면 상태 변경 항목이 하나도 없다', () => {
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
