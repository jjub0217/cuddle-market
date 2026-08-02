import { describe, expect, it } from 'vitest'

import { splitMention } from './mention'

// 답글 본문은 서버에 "@협주 내용" 꼴로 저장된다. 멘션 필드가 따로 없어서다.
// 서버가 답글을 깊이 구분 없이 평평하게 주기 때문에, 이 @표시가 없으면
// 누구에게 단 답글인지 알 방법이 없다.

describe('splitMention', () => {
  it('맨 앞의 @닉네임을 떼어낸다', () => {
    expect(splitMention('@협주 ㅇㅇㅇㅇㅇㅇ')).toEqual({
      mention: '@협주',
      rest: ' ㅇㅇㅇㅇㅇㅇ',
    })
  })

  it('@가 없으면 그대로 둔다', () => {
    expect(splitMention('ddd')).toEqual({ mention: null, rest: 'ddd' })
  })

  it('본문 중간의 @는 안 뗀다', () => {
    expect(splitMention('메일은 a@b.com 이에요')).toEqual({
      mention: null,
      rest: '메일은 a@b.com 이에요',
    })
  })

  it('@만 있고 닉네임이 없으면 안 뗀다', () => {
    expect(splitMention('@ 안녕')).toEqual({ mention: null, rest: '@ 안녕' })
  })

  it('멘션만 있고 내용이 없어도 된다', () => {
    expect(splitMention('@협주')).toEqual({ mention: '@협주', rest: '' })
  })

  it('빈 글은 그대로', () => {
    expect(splitMention('')).toEqual({ mention: null, rest: '' })
  })

  it('앞에 공백이 있으면 멘션으로 보지 않는다', () => {
    expect(splitMention(' @협주 안녕')).toEqual({ mention: null, rest: ' @협주 안녕' })
  })
})
