import { describe, expect, it } from 'vitest'

import { hasPlaceRating } from './placeRating'

describe('hasPlaceRating', () => {
  // 운영에서 실제로 오는 모양이다. 이것을 못 거르면 화면에 「0.0」이 뜬다(#982).
  it('후기가 0개면 거짓이다 — 서버가 null 이 아니라 0 을 채워 보낸다', () => {
    expect(hasPlaceRating({ reviewCount: 0, averageRating: 0 })).toBe(false)
  })

  it('후기가 하나라도 있으면 참이다', () => {
    expect(hasPlaceRating({ reviewCount: 1, averageRating: 5 })).toBe(true)
    expect(hasPlaceRating({ reviewCount: 12, averageRating: 4.5 })).toBe(true)
  })

  it('요약 자체가 없으면 거짓이다', () => {
    expect(hasPlaceRating(null)).toBe(false)
    expect(hasPlaceRating(undefined)).toBe(false)
  })
})
