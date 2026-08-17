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
