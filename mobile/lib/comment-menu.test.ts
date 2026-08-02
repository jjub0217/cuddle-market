import { buildCommentMenu } from './comment-menu';

describe('buildCommentMenu', () => {
  it('내 댓글이면 삭제만 보여준다', () => {
    // 나를 신고할 이유가 없다. 게시글 상세도 내 글에는 ⋮ 자체를 안 그린다.
    expect(buildCommentMenu(7, 7)).toEqual([{ kind: 'delete', label: '삭제', tone: 'danger' }]);
  });

  it('남의 댓글이면 작성자 신고만 보여준다', () => {
    // 댓글 신고 API가 없어 작성자 신고로 보낸다.
    expect(buildCommentMenu(7, 9)).toEqual([{ kind: 'reportAuthor', label: '사용자 신고하기' }]);
  });

  it('로그인 안 했으면 삭제가 안 뜬다', () => {
    expect(buildCommentMenu(undefined, 9)).toEqual([
      { kind: 'reportAuthor', label: '사용자 신고하기' },
    ]);
  });

  it('로그인 안 했는데 작성자 id가 0이어도 삭제가 안 뜬다', () => {
    // undefined를 0과 같게 다루면(느슨한 비교 등) 0번 작성자의 댓글에 삭제가 뜬다.
    expect(buildCommentMenu(undefined, 0)).toEqual([
      { kind: 'reportAuthor', label: '사용자 신고하기' },
    ]);
  });
});
