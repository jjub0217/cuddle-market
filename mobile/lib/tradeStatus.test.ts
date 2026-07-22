import { getOverlay, getTradeLabel } from './tradeStatus'

// 근거: 요구사항 §4.1, UI 스펙 §5.
// 서버 코드값(tradeStatus) + productType 조합 → 라벨/오버레이 매핑을 검증한다.

describe('getTradeLabel', () => {
  it('SELLING → 판매중', () => {
    expect(getTradeLabel('SELLING', 'SELL')).toBe('판매중')
  })

  it('RESERVED → 예약중', () => {
    expect(getTradeLabel('RESERVED', 'SELL')).toBe('예약중')
  })

  it('COMPLETED → 판매완료 (일반 판매)', () => {
    expect(getTradeLabel('COMPLETED', 'SELL')).toBe('판매완료')
  })

  it('COMPLETED + REQUEST → 요청완료', () => {
    expect(getTradeLabel('COMPLETED', 'REQUEST')).toBe('요청완료')
  })

  it('null + REQUEST → 요청중', () => {
    expect(getTradeLabel(null, 'REQUEST')).toBe('요청중')
  })
})

describe('getOverlay', () => {
  it('판매중(SELLING)은 오버레이 없음(null)', () => {
    expect(getOverlay('SELLING', 'SELL')).toBeNull()
  })

  it('요청중(null + REQUEST)은 오버레이 없음(null)', () => {
    expect(getOverlay(null, 'REQUEST')).toBeNull()
  })

  it('예약중(RESERVED)은 스크림 0.40 + "예약중" pill', () => {
    expect(getOverlay('RESERVED', 'SELL')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.40)',
      label: '예약중',
    })
  })

  it('판매완료(COMPLETED)는 스크림 0.60 + "판매완료" pill', () => {
    expect(getOverlay('COMPLETED', 'SELL')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.60)',
      label: '판매완료',
    })
  })

  it('요청완료(COMPLETED + REQUEST)는 스크림 0.60 + "요청완료" pill', () => {
    expect(getOverlay('COMPLETED', 'REQUEST')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.60)',
      label: '요청완료',
    })
  })
})
