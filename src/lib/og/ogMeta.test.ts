import { describe, expect, it } from 'vitest'

import { OG_DEFAULT_IMAGE, buildProductOgDescription, pickCommunityOgImage, pickProductOgImage } from './ogMeta'

// 링크 미리보기 그림은 서버가 그리지 않고 이미 있는 사진을 그대로 쓴다(#1122).
// 그림에서 빠진 가격·거래 상태는 설명 글자로 옮긴다.

describe('pickProductOgImage', () => {
  it('대표 사진이 있으면 그 주소를 쓴다', () => {
    expect(pickProductOgImage('https://cdn/a.jpg')).toEqual({ url: 'https://cdn/a.jpg' })
  })

  it('WebP 사진도 그대로 쓴다', () => {
    expect(pickProductOgImage('https://cdn/a.webp')).toEqual({ url: 'https://cdn/a.webp' })
  })

  it.each([null, undefined, ''])('사진이 없으면(%s) 고정 그림', (v) => {
    expect(pickProductOgImage(v)).toEqual(OG_DEFAULT_IMAGE)
  })
})

describe('pickCommunityOgImage', () => {
  it('본문의 첫 사진을 쓴다', () => {
    expect(pickCommunityOgImage('글 ![a](https://cdn/1.png) ![b](https://cdn/2.png)')).toEqual({ url: 'https://cdn/1.png' })
  })

  it('사진 뒤에 붙은 제목 문구는 주소에서 뺀다', () => {
    expect(pickCommunityOgImage('![a](https://cdn/1.png "제목")')).toEqual({ url: 'https://cdn/1.png' })
  })

  it('http·https 가 아닌 주소는 건너뛰고 다음 사진을 본다', () => {
    expect(pickCommunityOgImage('![a](/local.png) ![b](data:image/png;base64,xx) ![c](https://cdn/3.png)')).toEqual({
      url: 'https://cdn/3.png',
    })
  })

  it.each([null, undefined, '', '사진 없는 글'])('사진이 없으면(%s) 고정 그림', (v) => {
    expect(pickCommunityOgImage(v)).toEqual(OG_DEFAULT_IMAGE)
  })
})

describe('buildProductOgDescription', () => {
  it('가격 · 상태 · 본문 순서', () => {
    expect(
      buildProductOgDescription({ price: 34000, productType: 'SELL', tradeStatus: 'SELLING', description: '여름에 시원합니다.' }),
    ).toBe('34,000원 · 판매중 · 여름에 시원합니다.')
  })

  it('판매완료는 판매완료로 나온다 (예전 그림은 판매중으로 잘못 나왔다)', () => {
    expect(buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'COMPLETED', description: 'x' })).toBe(
      '1,000원 · 판매완료 · x',
    )
  })

  it('판매요청은 희망 가격과 요청 상태', () => {
    expect(buildProductOgDescription({ price: 12000, productType: 'REQUEST', tradeStatus: null, description: 'x' })).toBe(
      '희망 12,000원 · 요청중 · x',
    )
  })

  it('본문이 없으면 가격과 상태만', () => {
    expect(buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'SELLING', description: '' })).toBe(
      '1,000원 · 판매중',
    )
  })

  it('본문의 줄바꿈은 공백이 된다', () => {
    expect(buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'SELLING', description: '첫 줄\n둘째 줄' })).toBe(
      '1,000원 · 판매중 · 첫 줄 둘째 줄',
    )
  })

  it('155자를 넘지 않는다', () => {
    const d = buildProductOgDescription({ price: 1000, productType: 'SELL', tradeStatus: 'SELLING', description: '가'.repeat(300) })
    expect(d.length).toBeLessThanOrEqual(155)
  })
})
