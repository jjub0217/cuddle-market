import { describe, expect, it } from 'vitest'

import { MAX_COMMENT_DEPTH, replyParentId } from './commentDepth'

// 서버는 깊이 3까지만 받는다. 4가 되면 CommentDepthExceededException이 난다.
//
// 실기기에서 깊이 3짜리 답글에 답글을 달았더니 아무 일도 안 일어난 것처럼 보였다 —
// 오류는 났지만 토스트가 키보드 뒤에 가려져 있었다 (2026-08-02).

describe('replyParentId', () => {
  it('대상을 안 골랐으면 스레드 부모에 단다', () => {
    expect(replyParentId(34, null)).toBe(34)
    expect(replyParentId(34, undefined)).toBe(34)
  })

  it('깊이 1짜리(부모 댓글)에는 그대로 단다', () => {
    expect(replyParentId(34, { commentId: 34, depth: 1 })).toBe(34)
  })

  it('깊이 2짜리 답글에는 그대로 단다', () => {
    // 3이 되므로 서버가 받는다
    expect(replyParentId(34, { commentId: 54, depth: 2 })).toBe(54)
  })

  it('깊이 3짜리 답글에는 스레드 부모에 단다', () => {
    // 그대로 달면 4가 되어 서버가 거절한다. @닉네임이 대상을 알려 주므로
    // 화면에 보이는 자리는 같다
    expect(replyParentId(34, { commentId: 55, depth: 3 })).toBe(34)
  })

  it('서버가 늘어난 깊이를 줘도 스레드 부모에 단다', () => {
    // 옛 데이터나 서버 규칙이 바뀌어 더 깊은 것이 와도 막히지 않아야 한다
    expect(replyParentId(34, { commentId: 60, depth: 9 })).toBe(34)
  })

  it('서버가 정한 한계는 3이다', () => {
    expect(MAX_COMMENT_DEPTH).toBe(3)
  })
})
