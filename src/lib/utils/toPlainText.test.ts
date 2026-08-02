import { describe, expect, it } from 'vitest'

import { toPlainText } from './toPlainText'

// 커뮤니티 상세 응답에 contentPreview가 없어(목록 전용) 본문을 잘라 메타 설명에 쓴다.
// 본문은 마크다운이라 그대로 자르면 기호가 검색 결과에 그대로 나온다.

describe('빈 값', () => {
  it('없으면 빈 글', () => {
    expect(toPlainText(undefined)).toBe('')
    expect(toPlainText(null)).toBe('')
    expect(toPlainText('')).toBe('')
  })
})

describe('기호 걷어내기', () => {
  it('제목 기호를 뗀다', () => {
    expect(toPlainText('## 사료 고르는 법')).toBe('사료 고르는 법')
  })

  it('굵게·기울임·코드 표시를 뗀다', () => {
    expect(toPlainText('**굵게** 와 *기울임* 과 `코드`')).toBe('굵게 와 기울임 과 코드')
  })

  it('이미지는 통째로 뺀다', () => {
    // 「이미지」 같은 대체 문구만 줄줄이 남으면 설명이 안 된다
    expect(toPlainText('앞 ![사진](https://cdn/a.webp) 뒤')).toBe('앞 뒤')
  })

  it('링크는 보이는 글자만 남긴다', () => {
    expect(toPlainText('[커들마켓](https://cuddle-market.vercel.app)에서')).toBe('커들마켓에서')
  })

  it('목록 기호를 뗀다', () => {
    expect(toPlainText('- 하나\n- 둘')).toBe('하나 둘')
    expect(toPlainText('1. 하나\n2. 둘')).toBe('하나 둘')
  })

  it('인용 기호를 뗀다', () => {
    expect(toPlainText('> 인용문입니다')).toBe('인용문입니다')
  })

  it('줄바꿈을 공백 하나로 모은다', () => {
    // 메타 설명은 한 줄이다
    expect(toPlainText('첫 줄\n\n\n둘째 줄')).toBe('첫 줄 둘째 줄')
  })
})

describe('길이 자르기', () => {
  it('짧으면 안 자른다', () => {
    expect(toPlainText('짧은 글', 100)).toBe('짧은 글')
  })

  it('길면 자르고 …을 붙인다', () => {
    const long = '가'.repeat(200)
    const result = toPlainText(long, 50)

    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(51)
  })

  it('말 중간에서 안 끊는다', () => {
    const original = '강아지 사료를 바꿨더니 통 안 먹어서 걱정입니다'
    const result = toPlainText(original, 20)
    const body = result.slice(0, -1) // … 를 뗀 부분

    expect(result.endsWith('…')).toBe(true)
    // 원문의 앞부분 그대로여야 하고, 끊긴 자리가 어절 경계(다음 글자가 공백)여야 한다.
    // 한글은 어절이 한글로 끝나므로 「마지막 글자가 한글이면 안 된다」로는 못 본다.
    expect(original.startsWith(body)).toBe(true)
    expect(original[body.length]).toBe(' ')
  })

  it('길이를 안 주면 안 자른다', () => {
    const long = '가'.repeat(300)
    expect(toPlainText(long)).toHaveLength(300)
  })
})

describe('실제 글', () => {
  it('마크다운 글에서 읽을 만한 설명이 나온다', () => {
    const post = `# 강아지 사료 바꿨더니 안 먹어요

수의사 **추천**으로 사료 바꿨는데 입에 안 맞는지 입도 안 대요.

![사진](https://cdn.example.com/a.webp)

- 3kg짜리 개봉
- 한 줌밖에 안 줌`

    const result = toPlainText(post, 155)

    expect(result).not.toContain('#')
    expect(result).not.toContain('**')
    expect(result).not.toContain('![')
    expect(result).not.toContain('https://')
    expect(result).toContain('수의사 추천으로')
  })
})
