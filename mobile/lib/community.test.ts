import {
  createComment,
  deleteComment,
  fetchComments,
  fetchPostDetail,
  fetchPosts,
  fetchReplies,
  flattenComments,
  replyParentId,
  reportPost,
} from './community';
import { isAlreadyReported } from './reports';

// 서버 응답을 그대로 붙여넣어 만든다.
// 9바퀴에 「다른 API가 이러니 이것도 그렇겠지」로 가정해 쓴 테스트가 틀린 모양을
// 통과시킨 일이 있었다. 아래 덩어리는 2026-08-01에 실제 서버에서 받은 것이다.

jest.mock('./auth/api', () => ({
  apiFetch: jest.fn(),
}));

const { apiFetch } = jest.requireMock('./auth/api') as { apiFetch: jest.Mock };

function okJson(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function errJson(status: number, message?: string) {
  return { ok: false, status, json: async () => ({ message }) } as unknown as Response;
}

beforeEach(() => {
  apiFetch.mockReset();
});

describe('fetchPosts', () => {
  it('data 안의 content와 hasNext를 꺼낸다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          page: 0,
          size: 10,
          content: [
            {
              id: 36,
              title: '강아지 사료 바꿨더니 안 먹어요',
              contentPreview: '수의사 추천으로…',
              thumbnailImageUrl: null,
              authorNickname: '협주',
              viewCount: 12,
              commentCount: 7,
              createdAt: '2026-04-01T10:00:00',
              updatedAt: '2026-04-01T10:00:00',
              isModified: false,
            },
          ],
          hasNext: true,
        },
      })
    );

    const page = await fetchPosts('QUESTION', 0);

    expect(page.content).toHaveLength(1);
    expect(page.content[0].id).toBe(36);
    expect(page.content[0].commentCount).toBe(7);
    expect(page.hasNext).toBe(true);
  });

  it('boardType과 page를 주소에 담는다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { content: [], hasNext: false } }));

    await fetchPosts('INFO', 2);

    expect(apiFetch).toHaveBeenCalledWith('/community/posts?boardType=INFO&page=2&size=10');
  });

  it('data가 비어도 빈 목록을 돌려준다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    const page = await fetchPosts('QUESTION', 0);

    expect(page.content).toEqual([]);
    expect(page.hasNext).toBe(false);
  });

  it('실패하면 던진다', async () => {
    apiFetch.mockResolvedValue(errJson(500));

    await expect(fetchPosts('QUESTION', 0)).rejects.toThrow('글 목록을 불러오지 못했어요');
  });
});

describe('fetchPostDetail', () => {
  it('상세 필드를 꺼낸다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          id: 36,
          authorId: 42,
          authorNickname: '협주',
          authorProfileImageUrl: 'https://cdn/x.webp',
          title: '강아지 사료',
          content: '수의사 추천으로 바꿨는데…',
          imageUrls: ['https://cdn/a.webp'],
          viewCount: 12,
          commentCount: 7,
          createdAt: '2026-04-01T10:00:00',
          updatedAt: '2026-04-01T10:00:00',
        },
      })
    );

    const post = await fetchPostDetail(36);

    expect(post.authorId).toBe(42);
    expect(post.content).toContain('수의사');
    expect(post.imageUrls).toEqual(['https://cdn/a.webp']);
  });

  it('imageUrls가 없으면 빈 배열이다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 1, title: 'x', content: 'y' } }));

    const post = await fetchPostDetail(1);

    expect(post.imageUrls).toEqual([]);
  });
});

describe('fetchComments', () => {
  // ⚠️ 껍질이 { data: { comments } }다. content가 아니다.
  it('data.comments를 꺼낸다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          comments: [
            {
              id: 34,
              authorId: 7,
              authorNickname: 'jjub0217',
              authorProfileImageUrl: '',
              content: '좀만 더 줘봐요',
              createdAt: '2026-04-01T10:00:00',
              depth: 1,
              parentId: null,
              hasChildren: true,
              childrenCount: 4,
            },
          ],
        },
      })
    );

    const comments = await fetchComments(36);

    expect(comments).toHaveLength(1);
    expect(comments[0].hasChildren).toBe(true);
    expect(comments[0].childrenCount).toBe(4);
  });

  it('comments가 없으면 빈 배열이다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: {} }));

    expect(await fetchComments(1)).toEqual([]);
  });
});

describe('fetchReplies', () => {
  // ⚠️ 서버가 깊이를 안 나누고 평평하게 준다. depth 2와 3이 같이 온다.
  it('깊이가 섞여 와도 그대로 돌려준다', async () => {
    apiFetch.mockResolvedValue(
      okJson({
        data: {
          comments: [
            {
              id: 54,
              authorId: 8,
              authorNickname: '협주',
              authorProfileImageUrl: '',
              content: 'ddd',
              createdAt: '2026-06-01T10:00:00',
              depth: 2,
              parentId: 34,
              hasChildren: true,
              childrenCount: 2,
            },
            {
              id: 55,
              authorId: 8,
              authorNickname: '협주',
              authorProfileImageUrl: '',
              content: '@협주 ㅇㅇㅇ',
              createdAt: '2026-06-01T11:00:00',
              depth: 3,
              parentId: 54,
              hasChildren: false,
              childrenCount: 0,
            },
          ],
        },
      })
    );

    const replies = await fetchReplies(34);

    expect(replies.map((reply) => reply.depth)).toEqual([2, 3]);
    expect(apiFetch).toHaveBeenCalledWith('/community/comments/34/replies');
  });
});

describe('flattenComments', () => {
  const parent = (id: number, children: number) => ({
    id,
    authorId: 1,
    authorNickname: 'a',
    authorProfileImageUrl: null,
    content: 'p',
    createdAt: '',
    depth: 1,
    parentId: null,
    hasChildren: children > 0,
    childrenCount: children,
  });
  const reply = (id: number, parentId: number) => ({
    id,
    authorId: 1,
    authorNickname: 'b',
    authorProfileImageUrl: null,
    content: 'r',
    createdAt: '',
    depth: 2,
    parentId,
    hasChildren: false,
    childrenCount: 0,
  });

  it('부모 → 그 답글들 → 다음 부모 순으로 편다', () => {
    const rows = flattenComments(
      [parent(1, 2), parent(2, 0)],
      new Map([[1, [reply(11, 1), reply(12, 1)]]])
    );

    expect(rows.map((row) => row.comment.id)).toEqual([1, 11, 12, 2]);
    expect(rows.map((row) => row.isReply)).toEqual([false, true, true, false]);
  });

  it('답글이 아직 안 온 부모는 그냥 부모만', () => {
    const rows = flattenComments([parent(1, 2)], new Map());

    expect(rows.map((row) => row.comment.id)).toEqual([1]);
  });

  it('댓글이 없으면 빈 목록', () => {
    expect(flattenComments([], new Map())).toEqual([]);
  });
});

describe('replyParentId', () => {
  // 서버는 깊이 3까지만 받는다. 4가 되면 CommentDepthExceededException이 난다.
  // 실기기에서 깊이 3짜리 답글에 답글을 달았더니 아무 일도 안 일어난 것처럼 보였다
  // (오류 토스트가 키보드 뒤에 가려져 있었다).

  it('대상을 안 골랐으면 스레드 부모에 단다', () => {
    expect(replyParentId(34, null)).toBe(34);
  });

  it('깊이 2짜리 답글에는 그대로 단다', () => {
    // 3이 되므로 서버가 받는다
    expect(replyParentId(34, { commentId: 54, depth: 2 })).toBe(54);
  });

  it('깊이 3짜리 답글에는 스레드 부모에 단다', () => {
    // 그대로 달면 4가 되어 서버가 거절한다. @닉네임이 대상을 알려 주므로
    // 화면에 보이는 자리는 같다
    expect(replyParentId(34, { commentId: 55, depth: 3 })).toBe(34);
  });
});

describe('createComment', () => {
  it('부모 댓글은 parentId를 안 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 1 } }));

    await createComment(36, '안녕하세요');

    expect(apiFetch).toHaveBeenCalledWith('/community/posts/36/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '안녕하세요' }),
    });
  });

  it('답글은 parentId를 같이 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 2 } }));

    await createComment(36, '@협주 네', 34);

    expect(apiFetch).toHaveBeenCalledWith('/community/posts/36/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '@협주 네', parentId: 34 }),
    });
  });

  it('앞뒤 공백은 떼고 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { id: 3 } }));

    await createComment(36, '  안녕  ');

    expect(apiFetch).toHaveBeenCalledWith('/community/posts/36/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '안녕' }),
    });
  });

  it('서버 문구를 그대로 살린다', async () => {
    apiFetch.mockResolvedValue(errJson(400, '차단한 사용자입니다'));

    await expect(createComment(36, 'x')).rejects.toThrow('차단한 사용자입니다');
  });
});

describe('deleteComment', () => {
  it('DELETE로 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    await deleteComment(55);

    expect(apiFetch).toHaveBeenCalledWith('/community/comments/55', { method: 'DELETE' });
  });
});

describe('reportPost', () => {
  // ⚠️ 게시글은 reasonCode(문자열)다. 상품만 reasonCodes(배열)다.
  it('reasonCode를 문자열로 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    await reportPost(36, 'SPAM_OR_AD');

    expect(apiFetch).toHaveBeenCalledWith('/reports/community-posts/36', {
      method: 'POST',
      body: JSON.stringify({ reasonCode: 'SPAM_OR_AD' }),
    });
  });

  it('상세 사유가 공백뿐이면 안 보낸다', async () => {
    apiFetch.mockResolvedValue(okJson({}));

    await reportPost(36, 'SPAM_OR_AD', '   ');

    expect(apiFetch).toHaveBeenCalledWith('/reports/community-posts/36', {
      method: 'POST',
      body: JSON.stringify({ reasonCode: 'SPAM_OR_AD' }),
    });
  });

  // 게시글 신고도 중복이면 화면이 「이미 신고했다」로 갈라야 한다(#817).
  // 상태 코드를 실은 ReportError로 던져야 isAlreadyReported가 알아본다.
  it('409면 이미 신고한 것으로 가려낼 수 있다', async () => {
    apiFetch.mockResolvedValue(errJson(409, '이미 신고된 대상입니다.'));

    const error = await reportPost(36, 'SPAM_OR_AD').catch((caught: unknown) => caught);

    expect(isAlreadyReported(error)).toBe(true);
  });
});
