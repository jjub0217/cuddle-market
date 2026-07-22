import { describe, it, expect } from 'vitest'
import { formatPrice, isTradeAvailable } from './format'

describe('formatPrice', () => {
  it('천 단위 콤마 + 원', () => {
    expect(formatPrice(1000)).toBe('1,000원')
    expect(formatPrice(0)).toBe('0원')
    expect(formatPrice(2000000)).toBe('2,000,000원')
  })
})

describe('isTradeAvailable', () => {
  it('판매중(SELLING)이거나 null이면 true', () => {
    expect(isTradeAvailable('SELLING')).toBe(true)
    expect(isTradeAvailable(null)).toBe(true)
  })
  it('예약중(RESERVED)·완료(COMPLETED)면 false', () => {
    expect(isTradeAvailable('RESERVED')).toBe(false)
    expect(isTradeAvailable('COMPLETED')).toBe(false)
  })
})
