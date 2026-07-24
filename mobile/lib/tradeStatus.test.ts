import { getOverlay } from './tradeStatus'

// 라벨 검증은 @cuddle/shared(Vitest)로 옮겼다.
// 여기서는 화면 표현인 오버레이 규칙만 본다. 근거: UI 스펙 §5.

describe('getOverlay', () => {
  it('판매중·요청중은 오버레이가 없다', () => {
    expect(getOverlay('SELLING', 'SELL')).toBeNull()
    expect(getOverlay(null, 'REQUEST')).toBeNull()
  })

  it('예약중은 스크림 0.40 + 예약중 pill', () => {
    expect(getOverlay('RESERVED', 'SELL')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.40)',
      label: '예약중',
    })
  })

  it('완료는 스크림 0.60이고 타입에 따라 라벨이 다르다', () => {
    expect(getOverlay('COMPLETED', 'SELL')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.60)',
      label: '판매완료',
    })
    expect(getOverlay('COMPLETED', 'REQUEST')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.60)',
      label: '요청완료',
    })
  })
})
