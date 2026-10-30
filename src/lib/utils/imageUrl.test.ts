import { describe, expect, it } from 'vitest'

import { getImageSrcSet, isOwnImageUrl, toResizedWebpUrl } from './imageUrl'

// 행사 소식 포스터는 기관 서버의 원래 주소를 그대로 쓴다(설계 9절).
// 우리 이미지 서버 규칙(uuid_150.webp)으로 바꾸면 없는 주소가 되어 반드시 깨진다.

const OWN = 'https://df1xl13ui5mlo.cloudfront.net/images/abc-123.jpg'
const EXTERNAL = 'https://www.nowon.kr/math/attach/x.png'

describe('우리 이미지 서버 주소인가', () => {
  it('CloudFront 주소면 참', () => {
    expect(isOwnImageUrl(OWN)).toBe(true)
  })

  it('기관 서버 주소면 거짓', () => {
    expect(isOwnImageUrl(EXTERNAL)).toBe(false)
  })

  it('주소로 못 읽는 글자는 거짓', () => {
    expect(isOwnImageUrl('not a url')).toBe(false)
  })
})

describe('크기 변환', () => {
  it('우리 주소는 기존대로 크기별 webp', () => {
    expect(toResizedWebpUrl(OWN, 150)).toBe('https://df1xl13ui5mlo.cloudfront.net/images/abc-123_150.webp')
    expect(getImageSrcSet(OWN)).toContain('abc-123_400.webp 400w')
  })

  it('외부 주소는 그대로 쓰고 srcset 은 비운다', () => {
    expect(toResizedWebpUrl(EXTERNAL, 150)).toBe(EXTERNAL)
    expect(getImageSrcSet(EXTERNAL)).toBe('')
  })

  it('주소로 못 읽는 글자도 그대로', () => {
    expect(toResizedWebpUrl('not a url', 800)).toBe('not a url')
  })

  it('빈 값은 빈 글자', () => {
    expect(toResizedWebpUrl(null, 150)).toBe('')
    expect(getImageSrcSet(undefined)).toBe('')
  })
})
