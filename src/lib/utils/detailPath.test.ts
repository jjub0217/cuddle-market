import { describe, expect, it } from 'vitest'

import { communityDetailPath, productDetailPath } from './detailPath'
import { toUrlName } from './toUrlName'

// #909 — 이름 없는 짧은 주소(/community/39)로 들어오면 이름 붙은 주소로 넘겨준다.
// 그 주소는 응답 헤더(Location)에 실리는데, Node 는 헤더 값에 아스키 밖 글자를 못 넣는다.
// 한글 제목이 그대로 들어가면 운영에서 500 이 났다. 여기서 그걸 막는다.

/** 아스키(코드 0~127) 밖 글자가 하나라도 있으면 헤더에 못 실린다 */
const ASCII_ONLY = /^[\x20-\x7E]*$/

describe('아스키만 남는다', () => {
  it.each([
    ['한글 제목', '마크다운 테스트'],
    ['한글·기호 섞임', '강아지 첫 용품 추천?'],
    ['한자·일본어', '犬のごはん'],
    ['이모지', '사료 추천 🐶'],
    ['영문·숫자', 'Hello World 123'],
    ['빈 글', ''],
  ])('%s', (_이름, 제목) => {
    expect(productDetailPath(74, 제목)).toMatch(ASCII_ONLY)
    expect(communityDetailPath(39, 제목)).toMatch(ASCII_ONLY)
  })

  it('헤더 값으로 실을 수 있다', () => {
    // 아스키 검사를 통과했는지 실제 규격으로 한 번 더 본다.
    // (URL 은 아스키만 받으므로, 한글이 남아 있으면 여기서 다르게 나온다)
    const path = communityDetailPath(39, '마크다운 테스트')
    const url = new URL(path, 'https://cuddle-market.vercel.app')

    expect(url.pathname).toBe(path)
  })
})

describe('주소 모양', () => {
  it('상품은 /products/{id}/{이름}', () => {
    expect(productDetailPath(74, 'Hello World')).toBe('/products/74/helloworld')
  })

  it('커뮤니티는 /community/{id}/{이름}', () => {
    expect(communityDetailPath(39, 'Hello World')).toBe('/community/39/helloworld')
  })

  it('풀어 보면 toUrlName 결과 그대로다', () => {
    // 받는 쪽 페이지가 주소를 풀어 제목과 견주므로, 감싸도 값이 달라지면 안 된다
    const 제목 = '강아지 사료 바꿨더니 안 먹어요'
    const 이름 = communityDetailPath(39, 제목).split('/')[3]

    expect(decodeURIComponent(이름)).toBe(toUrlName(제목))
  })

  it('id 는 숫자로 줘도 문자로 줘도 같다', () => {
    expect(productDetailPath(74, '사료')).toBe(productDetailPath('74', '사료'))
  })
})
