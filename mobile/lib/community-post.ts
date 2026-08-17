import { apiFetch } from './auth/api';
import { readMessage } from './reports';

import type { BoardType } from './community';

// 커뮤니티 글쓰기. 서버가 받는 값은 PostCreateRequest.java 에 있다.
//
// ⚠️ **사진은 본문 마크다운으로 넣는다.** imageUrls 자리가 있지만 서버는 목록 썸네일을
//    본문 첫 ![](주소) 에서 뽑는다(PostListItemResponse.java:63). 웹도 imageUrls 를
//    늘 빈 배열로 보낸다 — 앱만 다르게 하면 앱에서 쓴 글에만 썸네일이 안 생긴다.

export const MAX_TITLE_LENGTH = 50;
export const MAX_CONTENT_LENGTH = 1000;
/** 제목·본문 둘 다 이만큼은 있어야 서버가 받는다 */
export const MIN_LENGTH = 2;

/** 사진 한 장을 본문에 넣는 모양. 웹 편집기가 넣는 것과 같다 */
export function imageMarkdown(url: string): string {
  return `![](${url})`;
}

/** 본문과 사진을 합쳐 서버로 보낼 content 를 만든다 */
export function buildContent(body: string, imageUrls: string[]): string {
  const 글 = body.trim();
  if (imageUrls.length === 0) return 글;

  const 사진들 = imageUrls.map(imageMarkdown).join('\n');
  return 글 ? `${글}\n\n${사진들}` : 사진들;
}

/** 본문에서 사진을 찾는 규칙. 대체 글자가 있든 없든 주소만 꺼낸다 */
const IMAGE_LINE = /!\[[^\]]*\]\(([^)]+)\)/g;

/**
 * 본문에서 사진을 꺼내 나눈다. `buildContent` 의 반대다.
 *
 * 왜 필요한가 — **서버가 사진을 따로 안 준다.** 상세 응답의 `imageUrls` 는 늘 비어 있고
 * (실제 응답으로 확인했다) 사진은 본문 마크다운 안에만 있다. 수정 화면이 사진 칸을
 * 채우려면 여기서 꺼내야 한다.
 *
 * ⚠️ **중간에 있던 사진은 끝으로 밀린다.** 웹에서 「글1 [사진] 글2」로 쓴 글을 앱에서
 *    고치면 「글1 글2」 + 사진이 된다. 앱에는 마크다운 편집기가 없어 「글 중간」을
 *    표현할 길이 없다 — 의도한 대가다(설계 문서 참고). 앱에서 쓴 글은 사진이 원래
 *    끝에 있어 안 걸린다.
 */
export function splitContent(content: string): { body: string; imageUrls: string[] } {
  const imageUrls = [...content.matchAll(IMAGE_LINE)].map((m) => m[1]);
  const body = content
    .replace(IMAGE_LINE, '')
    // 사진을 걷어낸 자리에 남는 빈 줄을 정리한다. 세 줄 이상은 두 줄로 줄이고 앞뒤를 턴다.
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { body, imageUrls };
}

/**
 * 앞으로 더 쓸 수 있는 글자 수.
 *
 * ⚠️ **사진 몫을 빼야 한다.** 서버 한계는 합친 본문 1000자인데 사진 한 줄이 100자
 *    안팎이다. 안 빼면 「999자 썼는데 등록이 안 된다」가 난다 — 서버 오류로만 알게 된다.
 */
export function remainingBodyLength(body: string, imageUrls: string[]): number {
  return MAX_CONTENT_LENGTH - buildContent(body, imageUrls).length;
}

export async function createPost(input: {
  title: string;
  body: string;
  imageUrls: string[];
  boardType: BoardType;
}): Promise<void> {
  const res = await apiFetch('/community/posts', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      content: buildContent(input.body, input.imageUrls),
      // ⚠️ 늘 빈 배열이다. 웹도 그렇고 서버도 목록 썸네일에 안 쓴다.
      imageUrls: [],
      boardType: input.boardType,
    }),
  });

  if (!res.ok) {
    // 서버 문구를 그대로 살린다 — 차단·권한 같은 것을 화면이 구별해야 한다
    // (community.ts 의 createComment 와 같은 방식).
    const message = await readMessage(res);
    throw new Error(message ?? `글 등록에 실패했어요 (HTTP ${res.status})`);
  }
}

/**
 * 글 고치기. 보내는 규칙은 `createPost` 와 같다 — 사진은 본문에 넣고 imageUrls 는 비운다.
 *
 * ⚠️ PATCH 다. 서버가 PatchMapping 이다(CommunityController.java:159).
 */
export async function updatePost(
  postId: number,
  input: { title: string; body: string; imageUrls: string[]; boardType: BoardType }
): Promise<void> {
  const res = await apiFetch(`/community/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: input.title.trim(),
      content: buildContent(input.body, input.imageUrls),
      imageUrls: [],
      boardType: input.boardType,
    }),
  });

  if (!res.ok) {
    const message = await readMessage(res);
    throw new Error(message ?? `글 수정에 실패했어요 (HTTP ${res.status})`);
  }
}

/** 글 지우기. 되돌릴 수 없다 — 부르는 쪽이 확인창을 거쳐야 한다 */
export async function deletePost(postId: number): Promise<void> {
  const res = await apiFetch(`/community/posts/${postId}`, { method: 'DELETE' });

  if (!res.ok) {
    const message = await readMessage(res);
    throw new Error(message ?? `글 삭제에 실패했어요 (HTTP ${res.status})`);
  }
}
