import { apiFetch } from './auth/api';
import { ReportError, readMessage } from './reports';

// 커뮤니티 서버 호출을 한 곳에 모은다.
//
// 서버를 실물로 열어 확인한 것 넷 (2026-08-01):
//   1) commentCount는 부모 + 답글 합계다. 글 36은 7인데 부모 댓글은 2개다
//   2) 답글은 깊이를 안 나누고 평평하게 온다 (depth 2와 3이 한 목록에)
//   3) 댓글 목록에는 페이지가 없다. 한 번에 전부 온다
//   4) 댓글 신고·좋아요 API가 없다
//
// 응답 껍질이 API마다 다르다. 여기서 벗겨서 화면에는 알맹이만 준다.
//   글 목록   { data: { content, hasNext } }
//   댓글      { data: { comments } }        ← content가 아니다

/** 웹과 같은 두 갈래. 서버 BoardType enum이다 */
export type BoardType = 'QUESTION' | 'INFO';

const PAGE_SIZE = 10; // 웹 fetchInitialQuestionCommunity와 같은 값

export interface PostListItem {
  id: number;
  title: string;
  /** 내용 미리보기. 서버가 최대 100자로 잘라 준다 */
  contentPreview: string;
  thumbnailImageUrl: string | null;
  authorNickname: string;
  viewCount: number;
  /** ⚠️ 부모 댓글 + 답글 합계다 */
  commentCount: number;
  createdAt: string;
}

export interface PostDetail {
  id: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  title: string;
  /** 마크다운이다. 이미지도 이 안에 ![](url)로 들어 있다 */
  content: string;
  /**
   * ⚠️ 본문 마크다운에 들어 있는 것과 같은 사진들이다.
   * 본문을 그리면서 이것까지 따로 그리면 같은 사진이 두 번 나온다.
   */
  imageUrls: string[];
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CommentItem {
  id: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  /** 답글이면 "@닉네임 내용" 꼴일 수 있다. splitMention으로 가른다 */
  content: string;
  createdAt: string;
  /** 1=부모 댓글, 2 이상=답글 */
  depth: number;
  parentId: number | null;
  hasChildren: boolean;
  childrenCount: number;
}

export interface PostPage {
  content: PostListItem[];
  hasNext: boolean;
}

/**
 * 검색은 늘 「제목+내용」이다.
 *
 * ⚠️ 서버는 `title` · `title_content` · `writer` 셋을 다 받고 진짜로 돈다
 *    (`PostRepositoryCustomImpl.java:56-72`). 그런데 **고르는 자리를 안 뒀다** —
 *    「제목」은 「제목+내용」의 부분집합이고, 「작성자로 찾기」는 프로필 화면이 하는 일이다
 *    (#857 설계 §2). 웹도 같은 값으로 못 박혀 있다(`CommunityPage.tsx` 의 SEARCH_TYPE).
 */
const SEARCH_TYPE = 'title_content';

/** 글 목록을 좁히는 조건. */
export interface PostListParams {
  boardType: BoardType;
  /** 0부터 시작하는 페이지 번호 */
  page: number;
  /** 검색어. 빈 값이면 안 싣는다 */
  keyword?: string;
  /** 'latest'(기본) | 'views' | 'comments'. 안 주면 서버가 latest 로 본다 */
  sortBy?: string;
}

export async function fetchPosts({
  boardType,
  page,
  keyword,
  sortBy,
}: PostListParams): Promise<PostPage> {
  const query = new URLSearchParams({
    boardType,
    page: String(page),
    size: String(PAGE_SIZE),
  });

  // ⚠️ **빈 값은 아예 안 싣는다.** 빈 글자를 보내면 서버가 그런 조건을 찾는다.
  //    URLSearchParams 가 한글을 알아서 주소용으로 바꿔 준다.
  if (keyword) {
    query.set('searchType', SEARCH_TYPE);
    query.set('keyword', keyword);
  }
  if (sortBy) query.set('sortBy', sortBy);

  const res = await apiFetch(`/community/posts?${query.toString()}`);
  if (!res.ok) throw new Error(`글 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { content?: PostListItem[]; hasNext?: boolean } };

  return {
    content: body.data?.content ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

export async function fetchPostDetail(postId: number): Promise<PostDetail> {
  const res = await apiFetch(`/community/posts/${postId}`);
  if (!res.ok) throw new Error(`글을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data: Partial<PostDetail> & { id: number } };
  const data = body.data;

  return {
    id: data.id,
    authorId: data.authorId ?? 0,
    authorNickname: data.authorNickname ?? '',
    authorProfileImageUrl: data.authorProfileImageUrl ?? null,
    title: data.title ?? '',
    content: data.content ?? '',
    imageUrls: data.imageUrls ?? [],
    viewCount: data.viewCount ?? 0,
    commentCount: data.commentCount ?? 0,
    createdAt: data.createdAt ?? '',
  };
}

/** 부모 댓글만 온다. 답글은 fetchReplies로 따로 부른다 */
export async function fetchComments(postId: number): Promise<CommentItem[]> {
  const res = await apiFetch(`/community/posts/${postId}/comments`);
  if (!res.ok) throw new Error(`댓글을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { comments?: CommentItem[] } };
  return body.data?.comments ?? [];
}

/**
 * 부모 댓글 하나 아래의 답글 전부.
 * ⚠️ 깊이를 안 나눈다 — depth 2(부모에 단 것)와 3(답글에 단 것)이 같이 온다.
 *    화면에서도 들여쓰기는 한 겹뿐이고, 대상은 본문의 @표시로 구분한다.
 */
export async function fetchReplies(commentId: number): Promise<CommentItem[]> {
  const res = await apiFetch(`/community/comments/${commentId}/replies`);
  if (!res.ok) throw new Error(`답글을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { comments?: CommentItem[] } };
  return body.data?.comments ?? [];
}

/** 화면에 그릴 한 줄 */
export interface CommentRowItem {
  comment: CommentItem;
  isReply: boolean;
}

/**
 * 부모 → 그 답글들 → 다음 부모 순으로 편다.
 *
 * 목록 조각이 한 줄기만 받으므로 여기서 미리 편다.
 * 답글이 아직 안 온 부모는 부모만 그린다 — 자리를 비워 두면 화면이 튄다.
 */
export function flattenComments(
  parents: CommentItem[],
  repliesByParent: Map<number, CommentItem[]>
): CommentRowItem[] {
  return parents.flatMap((parent) => [
    { comment: parent, isReply: false },
    ...(repliesByParent.get(parent.id) ?? []).map((reply) => ({ comment: reply, isReply: true })),
  ]);
}

// 댓글 수를 화면에서 직접 세는 함수를 여기 뒀었다. 안 쓰기로 했다 —
// 댓글을 달거나 지운 뒤 상세를 다시 받으므로(queryKey 'communityPost') 서버가 준
// commentCount가 곧바로 맞는 값이 된다. 두 군데서 세면 어긋날 자리만 생긴다.

export async function createComment(
  postId: number,
  content: string,
  parentId?: number
): Promise<void> {
  const trimmed = content.trim();
  const res = await apiFetch(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: trimmed, ...(parentId ? { parentId } : {}) }),
  });

  if (!res.ok) {
    // 서버 문구를 그대로 살린다 — 차단·권한 같은 것을 화면이 구별해야 한다.
    const message = await readMessage(res);
    throw new Error(message ?? `댓글 등록에 실패했어요 (HTTP ${res.status})`);
  }
}

export async function deleteComment(commentId: number): Promise<void> {
  const res = await apiFetch(`/community/comments/${commentId}`, { method: 'DELETE' });
  if (!res.ok) {
    const message = await readMessage(res);
    throw new Error(message ?? `댓글 삭제에 실패했어요 (HTTP ${res.status})`);
  }
}

/**
 * 게시글 신고.
 *
 * ⚠️ reasonCode(문자열)다. 상품 신고만 reasonCodes(배열)다 — lib/reports.ts 참고.
 *
 * 상품·사용자 신고와 같은 ReportError로 던진다. 중복 신고(409)를 화면이
 * 갈라내야 하는데, 그 판별이 상태 코드 기준이기 때문이다(#817).
 */
export async function reportPost(
  postId: number,
  reasonCode: string,
  detailReason?: string
): Promise<void> {
  const detail = detailReason?.trim();
  const res = await apiFetch(`/reports/community-posts/${postId}`, {
    method: 'POST',
    body: JSON.stringify({ reasonCode, ...(detail ? { detailReason: detail } : {}) }),
  });

  if (!res.ok) {
    const message = await readMessage(res);
    throw new ReportError(message ?? `게시글 신고에 실패했어요 (HTTP ${res.status})`, res.status);
  }
}
