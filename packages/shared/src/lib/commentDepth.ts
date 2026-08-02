// 답글을 어느 댓글 아래에 달지 정한다. 웹과 앱이 같이 쓴다.
//
// 왜 shared인가: 서버 제약에서 나온 규칙이라 웹과 앱이 다를 이유가 없다.
// 실제로 양쪽 다 같은 구멍이 있었다 — 고른 댓글의 id를 그대로 보내고 있었다.

/**
 * 서버가 받는 가장 깊은 댓글.
 *
 *   부모 댓글        depth 1
 *   └ 답글          depth 2
 *      └ 답글의 답글  depth 3   ← 여기까지다
 *
 * 서버 CommunityServiceImpl:
 *   `if (parentDepth >= 3) throw new CommentDepthExceededException()`
 */
export const MAX_COMMENT_DEPTH = 3

/** 답글을 달 대상. 화면마다 담는 그릇이 달라 필요한 둘만 받는다 */
export interface ReplyTargetDepth {
  /** 그 댓글의 id */
  commentId: number
  /** 그 댓글의 깊이 */
  depth: number
}

/**
 * 답글을 **어느 댓글 아래에** 달지.
 *
 * 깊이 3짜리 답글에 그대로 달면 4가 되어 서버가 거절한다. 그때는 **그 스레드의 부모**에
 * 단다 — 서버가 답글을 깊이 구분 없이 평평하게 주므로 화면에 보이는 자리는 같고,
 * 누구에게 한 말인지는 본문 앞의 @닉네임이 알려 준다.
 *
 * 앱에서는 이걸 안 해서 답글이 조용히 안 달렸다. 오류는 났지만 토스트가
 * 키보드 뒤에 가려져 아무 일도 안 일어난 것처럼 보였다 (2026-08-02 실기기).
 *
 * @param threadParentId 그 스레드의 원 댓글 (depth 1)
 * @param target 지금 고른 대상. 없으면 스레드에 단다
 */
export function replyParentId(
  threadParentId: number,
  target: ReplyTargetDepth | null | undefined
): number {
  if (!target) return threadParentId
  return target.depth >= MAX_COMMENT_DEPTH ? threadParentId : target.commentId
}
