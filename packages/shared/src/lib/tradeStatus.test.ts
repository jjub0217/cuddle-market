import { describe, it, expect } from 'vitest'
import { getTradeLabel } from './tradeStatus'

describe('getTradeLabel', () => {
  it('판매(SELL) 글의 거래상태', () => {
    expect(getTradeLabel('SELLING', 'SELL')).toBe('판매중')
    expect(getTradeLabel('RESERVED', 'SELL')).toBe('예약중')
    expect(getTradeLabel('COMPLETED', 'SELL')).toBe('판매완료')
    expect(getTradeLabel(null, 'SELL')).toBe('판매중')
  })

  it('판매요청(REQUEST) 글은 완료·없음일 때 라벨이 다르다', () => {
    expect(getTradeLabel('COMPLETED', 'REQUEST')).toBe('요청완료')
    expect(getTradeLabel(null, 'REQUEST')).toBe('요청중')
  })

  it('판매요청이어도 예약중은 그대로 예약중', () => {
    expect(getTradeLabel('RESERVED', 'REQUEST')).toBe('예약중')
  })
})
