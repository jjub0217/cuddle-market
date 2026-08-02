// 답글 본문 맨 앞의 @닉네임을 떼어낸다. 웹·앱이 같이 쓴다.
//
// 왜 이게 필요한가:
// 서버는 부모 댓글 하나 아래의 답글을 깊이 구분 없이 한 목록으로 평평하게 준다.
// (GET /community/comments/{id}/replies 가 depth 2와 3을 같이 준다)
// 그래서 화면에서 답글은 전부 같은 들여쓰기이고, 누구에게 단 답글인지는
// 본문에 박힌 @표시로만 알 수 있다.
//
// 멘션 필드가 서버에 따로 없어서 글자에 섞여 저장된다. 웹이 예전부터 그렇게 해왔고,
// 오늘의집도 같은 방식이다(입력칸에 @닉네임을 미리 채우고 지울 수 있게 둔다).

/** 웹 CommentItem이 쓰던 정규식과 같다. 맨 앞의 `@`+공백없는 글자 덩어리만 본다. */
const MENTION_AT_START = /^(@\S+)([\s\S]*)$/

export interface SplitMention {
  /** 맨 앞 멘션. 없으면 null */
  mention: string | null
  /** 멘션을 뗀 나머지. 멘션이 없으면 원본 그대로 */
  rest: string
}

export function splitMention(content: string): SplitMention {
  const match = content.match(MENTION_AT_START)
  if (!match) return { mention: null, rest: content }

  const [, mention, rest] = match
  return { mention, rest }
}
