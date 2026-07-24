import { describe, it, expect } from 'vitest'
import { getProductTypeLabel, getProductStatusLabel } from './productLabels'

describe('getProductTypeLabel', () => {
  it('SELL은 판매, REQUEST는 판매요청', () => {
    expect(getProductTypeLabel('SELL')).toBe('판매')
    expect(getProductTypeLabel('REQUEST')).toBe('판매요청')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getProductTypeLabel('WHAT')).toBe('WHAT')
  })
})

describe('getProductStatusLabel', () => {
  it('4가지 상품 상태를 한글로 바꾼다', () => {
    expect(getProductStatusLabel('NEW')).toBe('새 상품')
    expect(getProductStatusLabel('LIKE_NEW')).toBe('거의 새것')
    expect(getProductStatusLabel('USED')).toBe('사용감 있음')
    expect(getProductStatusLabel('NEED_REPAIR')).toBe('수리 필요')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getProductStatusLabel('BROKEN')).toBe('BROKEN')
  })
})
