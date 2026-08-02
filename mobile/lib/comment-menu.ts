// 댓글 ⋮ 에 무엇을 보일지 정한다.
//
// 화면에서 떼어 순수 함수로 둔 이유(product-menu.ts와 같은 결):
// 「내 것이냐」 판정이 로그인 여부에 걸려 있다. 게스트는 내 정보가 없어 누구인지 모르는데,
// 여기서 어긋나면 남의 댓글에 「삭제」가 뜬다. 눌러도 서버가 막지만, 뜨는 것 자체가
// 지킬 수 없는 약속이다. 화면 없이 시험할 수 있어야 한다.
//
// ⚠️ 댓글 신고 API가 서버에 없다 — 신고는 상품·사용자·게시글 셋뿐이다.
//    그래서 남의 댓글은 **작성자 신고**로 보낸다. 문구도 신고 화면 제목과 같은
//    「사용자 신고하기」로 두어 무엇을 신고하는지 헷갈리지 않게 한다.

export type CommentMenuKind = 'delete' | 'reportAuthor';

export interface CommentMenuItem {
  kind: CommentMenuKind;
  /** 시트에 그릴 문구 */
  label: string;
  /** danger는 되돌릴 수 없는 동작(삭제)에만 쓴다. */
  tone?: 'default' | 'danger';
}

/**
 * @param myUserId 지금 로그인한 사람. 게스트면 undefined다.
 * @param authorId 그 댓글을 쓴 사람.
 */
export function buildCommentMenu(
  myUserId: number | undefined,
  authorId: number
): CommentMenuItem[] {
  // undefined는 어떤 id와도 같지 않아야 한다. `me?.id === authorId`를 화면에서 바로 쓰면
  // 나중에 id가 0인 자리표시자가 끼어들 때 조용히 어긋난다(상품 상세에서 겪었다).
  if (myUserId !== undefined && myUserId === authorId) {
    return [{ kind: 'delete', label: '삭제', tone: 'danger' }];
  }

  return [{ kind: 'reportAuthor', label: '사용자 신고하기' }];
}
