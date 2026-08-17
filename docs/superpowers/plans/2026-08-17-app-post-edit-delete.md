# 앱 커뮤니티 글 수정·삭제 구현 계획 (#924)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에서 내가 쓴 커뮤니티 글을 고치고 지운다.

**Architecture:** 서버가 사진을 따로 안 주므로(본문 마크다운 안에만 있다) **본문에서 사진을 꺼내** 사진 칸에 올린다. 저장할 때 글쓰기와 같은 `buildContent` 로 다시 합친다. 수정 화면은 새로 만들지 않고 글쓰기 화면에 「수정 모드」를 더한다.

**Tech Stack:** Expo SDK 54 · React Native 0.81.5 · expo-router · Jest(jest-expo) + RNTL 14

설계 문서: `docs/superpowers/specs/2026-08-17-app-post-edit-delete-design.md`

## Global Constraints

```
브랜치        feat/924--post-edit-delete  (origin/develop 에서 딴다. 설계 문서 커밋이 이미 있다)
PR base       develop · 관련 이슈는 목록 항목으로 `- Close #924`
새 의존성      0 개. package.json 을 고치지 마라
서버 한계      제목 2~50자 · 본문 2~1000자 · 사진 최대 5장  (글쓰기와 같다)
문구          웹에서 쓰는 말을 그대로 쓴다. 새로 짓지 마라
게이트        저장소 루트에서 `pnpm gate:mobile` (⚠️ `cd mobile` 뒤 루트 명령은 실패한다)
```

⚠️ **`render`·`rerender`·`fireEvent` 는 셋 다 `await` 해야 한다**(RNTL 14). 안 그러면 오류 없이 옛 값을 줘서 **시험이 조용히 틀린 것을 통과시킨다**.

⚠️ **`app/` 안에 시험 파일을 두지 마라.** expo-router 가 화면으로 보고 번들에 끼워 넣어 **실기기가 아예 안 뜬다.** 화면 시험은 `mobile/__tests__/` 에 둔다.

⚠️ **서버가 사진을 따로 안 준다.** 실제 응답으로 확인했다 — 사진 두 장이 든 글(#39)인데 `imageUrls` 가 `[]` 였다. 사진은 본문 `![](주소)` 안에만 있다.

---

## 파일 구조

```
고친다
  mobile/lib/community-post.ts                       splitContent · updatePost · deletePost 를 더한다
  mobile/lib/community-post.test.ts
  mobile/app/community-post.tsx                      「수정 모드」를 더한다
  mobile/__tests__/community-post-screen.test.tsx
  mobile/app/(tabs)/(community)/posts/[id].tsx       내 글에 ⋮ 메뉴 (지금은 남의 글에만 있다)

새로 만든다
  mobile/__tests__/community-detail-menu.test.tsx    ⋮ 메뉴 시험
```

## 과제 차례

```
Task 1  splitContent           본문에서 사진 꺼내기. 순수 함수라 시험이 쉽다. 여기가 알맹이
Task 2  updatePost · deletePost 서버 부르기
Task 3  수정 모드              글쓰기 화면에 더한다
Task 4  내 글 ⋮ 메뉴 + 삭제     들어가는 길
Task 5  게이트 + 실기기 확인
```

---

### Task 1: `splitContent` — 본문에서 사진 꺼내기

**Files:**
- Modify: `mobile/lib/community-post.ts`
- Test: `mobile/lib/community-post.test.ts`

**Interfaces:**
- Consumes: 같은 파일의 `buildContent(body: string, imageUrls: string[]): string`
- Produces:
  ```ts
  /** 본문에서 사진을 꺼내 나눈다. buildContent 의 반대다 */
  export function splitContent(content: string): { body: string; imageUrls: string[] }
  ```

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

`mobile/lib/community-post.test.ts` 맨 아래에 붙인다.

```ts
describe('본문에서 사진 꺼내기', () => {
  it('사진이 없으면 글만 나온다', () => {
    expect(splitContent('안녕하세요')).toEqual({ body: '안녕하세요', imageUrls: [] });
  });

  it('끝에 붙은 사진을 꺼낸다', () => {
    expect(splitContent(`안녕하세요\n\n${imageMarkdown(A)}\n${imageMarkdown(B)}`)).toEqual({
      body: '안녕하세요',
      imageUrls: [A, B],
    });
  });

  it('사진만 있는 글도 나눈다', () => {
    expect(splitContent(imageMarkdown(A))).toEqual({ body: '', imageUrls: [A] });
  });

  // ⚠️ **이것이 의도한 대가다.** 웹에서 글 중간에 사진을 넣어 쓴 글을 앱에서 고치면
  //    사진이 끝으로 밀린다. 앱에는 마크다운 편집기가 없어 「글 중간」을 표현할 길이 없다.
  //    버그가 아니다 — 이 시험이 그것을 못 박는다(설계 문서 참고).
  it('중간에 있던 사진은 끝으로 밀린다 (의도한 대가)', () => {
    const 웹에서쓴글 = `앞글\n\n${imageMarkdown(A)}\n\n뒷글`;

    expect(splitContent(웹에서쓴글)).toEqual({ body: '앞글\n\n뒷글', imageUrls: [A] });
  });

  it('빈 글도 터지지 않는다', () => {
    expect(splitContent('')).toEqual({ body: '', imageUrls: [] });
  });

  // 꺼냈다 도로 합치면 사진 차례가 그대로여야 한다.
  it('꺼냈다 합치면 사진 차례가 유지된다', () => {
    const 원본 = buildContent('안녕하세요', [A, B]);
    const { body, imageUrls } = splitContent(원본);

    expect(buildContent(body, imageUrls)).toBe(원본);
  });

  it('대체 글자가 있는 사진도 꺼낸다', () => {
    expect(splitContent(`글\n\n![고양이](${A})`)).toEqual({ body: '글', imageUrls: [A] });
  });
});
```

⚠️ 파일 맨 위 import 에 `splitContent` 를 더한다.

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest lib/community-post.test.ts
```
기대: `splitContent is not a function` 으로 실패.

- [ ] **Step 3: 만든다**

`mobile/lib/community-post.ts` 에 더한다.

```ts
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
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm --filter ./mobile exec jest lib/community-post.test.ts
```
기대: 전부 PASS(기존 7개 포함).

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/community-post.ts mobile/lib/community-post.test.ts
git commit -m "feat(app): 본문에서 사진을 꺼내는 splitContent (#924)"
```

---

### Task 2: `updatePost` · `deletePost`

**Files:**
- Modify: `mobile/lib/community-post.ts`
- Test: `mobile/lib/community-post.test.ts`

**Interfaces:**
- Consumes: `apiFetch` — `./auth/api` · `readMessage` — `./reports` (같은 파일이 이미 쓰고 있다)
- Produces:
  ```ts
  export async function updatePost(
    postId: number,
    input: { title: string; body: string; imageUrls: string[]; boardType: BoardType }
  ): Promise<void>
  export async function deletePost(postId: number): Promise<void>
  ```

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

```ts
// 서버 부르기는 fetch 를 갈아 끼워 본다. **products.test.ts 와 같은 방식**이다.
const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  // 시험 환경엔 .env 가 안 실린다. 주소를 직접 준다(안 주면 apiFetch 가 막는다)
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ code: 'SUCCESS', data: null }) });
});

/** 요청에 실린 두 번째 인자(method·body)를 꺼낸다 */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string };
}

describe('글 고치기·지우기', () => {
  it('고칠 때 PATCH 로 보낸다', async () => {
    await updatePost(39, { title: '제목', body: '내용', imageUrls: [A], boardType: 'QUESTION' });

    const [주소] = mockFetch.mock.calls[0];
    expect(String(주소)).toContain('/community/posts/39');
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('PATCH');
  });

  // 글쓰기와 같은 규칙이다 — 사진은 본문에 들어가고 imageUrls 는 빈 배열이다.
  it('고칠 때도 사진을 본문에 넣는다', async () => {
    await updatePost(39, { title: '제목', body: '내용', imageUrls: [A], boardType: 'QUESTION' });

    const 보낸것 = JSON.parse(initOf(mockFetch.mock.calls[0]).body!);
    expect(보낸것.content).toBe(buildContent('내용', [A]));
    expect(보낸것.imageUrls).toEqual([]);
  });

  it('지울 때 DELETE 로 보낸다', async () => {
    await deletePost(39);

    const [주소] = mockFetch.mock.calls[0];
    expect(String(주소)).toContain('/community/posts/39');
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('DELETE');
  });

  it('실패하면 서버 문구를 살린다', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: '내 글이 아니에요' }),
    });

    await expect(deletePost(39)).rejects.toThrow('내 글이 아니에요');
  });
});
```

⚠️ 이 파일의 기존 시험(순수 함수들)은 서버를 안 부르므로 위 `beforeEach` 가 방해되지 않는다. 그래도 **돌려서 기존 7개가 그대로 통과하는지** 확인한다.

`readMessage` 는 `json().message` 를 읽는다(`mobile/lib/reports.ts:47` 에서 확인함). 위 시험이 맞다.

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest lib/community-post.test.ts
```

- [ ] **Step 3: 만든다**

```ts
/**
 * 글 고치기. 보내는 규칙은 `createPost` 와 같다 — 사진은 본문에 넣고 imageUrls 는 비운다.
 *
 * ⚠️ PATCH 다. 서버가 PatchMapping 이다(CommunityController.java:161).
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
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm --filter ./mobile exec jest lib/community-post.test.ts
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/community-post.ts mobile/lib/community-post.test.ts
git commit -m "feat(app): 글 고치기·지우기 서버 부르기 (#924)"
```

---

### Task 3: 글쓰기 화면에 「수정 모드」

**Files:**
- Modify: `mobile/app/community-post.tsx`
- Test: `mobile/__tests__/community-post-screen.test.tsx`

**Interfaces:**
- Consumes: Task 1 의 `splitContent` · Task 2 의 `updatePost` · `fetchPostDetail` — `@/lib/community`
- Produces: 없음 (화면)

**들어가는 길:** `/community-post?postId=39` — `postId` 가 있으면 수정, 없으면 새 글.

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

```tsx
describe('수정 모드', () => {
  // ⚠️ 이 시험들은 useLocalSearchParams 가 postId 를 주도록 흉내 내야 한다.
  //    파일 맨 위의 jest.mock('expo-router', …) 를 열어 그 방식에 맞춘다.

  it('수정 모드면 헤더가 「게시글 수정」이다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });

    await waitFor(() => expect(screen.getByText('게시글 수정')).toBeTruthy());
  });

  it('원래 제목과 본문이 채워져 있다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });

    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));
    expect(본문칸().props.value).toBe('상태가 궁금해요');
  });

  // ⭐ 이 과제의 알맹이 — 본문에 있던 사진이 사진 칸으로 올라온다
  it('본문에 있던 사진이 사진 칸에 들어간다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });

    await waitFor(() => expect(screen.getByText('사진 (1/5)')).toBeTruthy());
  });

  it('저장하면 updatePost 를 부른다 (createPost 가 아니라)', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));

    await fireEvent.press(등록단추());

    await waitFor(() => expect(updatePost).toHaveBeenCalled());
    expect(createPost).not.toHaveBeenCalled();
  });
});
```

**흉내 내는 부분은 이렇게 고친다.** 그 파일 맨 위의 `jest.mock` 블록이 지금 이렇게 되어 있다.

```ts
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({}),           // ← 늘 빈 객체를 준다
}));

jest.mock('@/lib/community-post', () => ({
  ...jest.requireActual('@/lib/community-post'),
  createPost: jest.fn(),
}));
```

시험마다 `postId` 를 바꿔 줄 수 있게 이렇게 바꾼다.

```ts
// 시험마다 갈아 끼울 수 있게 밖에 둔다. 기본은 새 글(빈 객체)이다.
let 화면인자: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => 화면인자,
}));

jest.mock('@/lib/community-post', () => ({
  ...jest.requireActual('@/lib/community-post'),
  createPost: jest.fn(),
  updatePost: jest.fn(),          // ← 더한다
}));

// 원래 글을 받아 오는 것만 흉내 낸다. splitContent 는 진짜 것을 써야
// 「사진이 칸으로 올라오는가」를 이 시험이 지킬 수 있다.
jest.mock('@/lib/community', () => ({
  ...jest.requireActual('@/lib/community'),
  fetchPostDetail: jest.fn(),
}));

const { updatePost } = jest.requireMock('@/lib/community-post') as { updatePost: jest.Mock };
const { fetchPostDetail } = jest.requireMock('@/lib/community') as { fetchPostDetail: jest.Mock };

/** 수정 모드로 만든다. 사진 한 장이 본문에 들어 있는 글이다 */
function 수정모드로(덮어쓰기: Record<string, unknown> = {}) {
  화면인자 = { postId: '39' };
  fetchPostDetail.mockResolvedValue({
    id: 39,
    authorId: 7,
    authorNickname: '나',
    authorProfileImageUrl: null,
    title: '캣타워 질문',
    content: '상태가 궁금해요\n\n![](https://cdn/a.webp)',
    imageUrls: [],
    viewCount: 0,
    commentCount: 0,
    boardType: 'QUESTION',
    ...덮어쓰기,
  });
}
```

⚠️ `beforeEach` 에서 `화면인자 = {}` 로 되돌린다. 안 되돌리면 **앞 시험의 수정 모드가 다음 시험까지 이어져** 새 글 시험이 조용히 틀린 것을 통과시킨다.

⚠️ `PostDetail` 이 실제로 어떤 값을 갖는지는 `mobile/lib/community.ts:34` 를 열어 맞춘다. 위 목록에 없는 것이 있으면 더한다.

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest __tests__/community-post-screen.test.tsx
```

- [ ] **Step 3: 화면에 수정 모드를 더한다**

```tsx
const params = useLocalSearchParams<{ boardType?: string; postId?: string }>();
const postId = params.postId ? Number(params.postId) : null;
const isEdit = postId !== null;

// 수정 모드면 원래 글을 받아 채운다.
const { data: original } = useQuery({
  queryKey: ['communityPost', postId],
  queryFn: () => fetchPostDetail(postId!),
  enabled: isEdit,
});

// 받아 온 글을 칸에 붓는다. **한 번만** 붓는다 — 매번 부으면 사용자가 고친 것이 되돌아간다.
const [filled, setFilled] = useState(false);
if (original && !filled) {
  setFilled(true);
  setTitle(original.title);
  setBoardType(original.boardType);
  // ⭐ 본문에서 사진을 꺼내 나눠 담는다
  const { body: 글, imageUrls: 사진들 } = splitContent(original.content);
  setBody(글);
  setSlots(
    사진들.map((url, i) => ({ key: `orig-${i}`, localUri: url, url, failed: false }))
  );
}
```

⚠️ **렌더 도중에 상태를 맞춘다.** `useEffect` 로 하면 `react-hooks/set-state-in-effect` 가 막는다(웹에서 겪었다). 「이전 값을 기억해 두고 달라졌을 때만」이 이 저장소의 방식이다.

⚠️ **`localUri` 에 서버 주소를 넣는다.** `UploadSlot` 은 원래 「폰 안의 주소」를 담지만, 이미 올라간 사진은 그것이 곧 서버 주소다. 미리보기가 그 값을 쓰므로 넣어야 보인다.

나머지 세 곳도 고친다.

```
헤더 이름     isEdit ? '게시글 수정' : '게시글 작성'
보내기       isEdit ? updatePost(postId, …) : createPost(…)
성공 뒤       상세와 목록을 둘 다 무르게 한다
             await queryClient.invalidateQueries({ queryKey: ['communityPost', postId] })
             await queryClient.invalidateQueries({ queryKey: ['communityPosts'] })
             router.back()
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm --filter ./mobile exec jest __tests__/community-post-screen.test.tsx
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/app/community-post.tsx mobile/__tests__/community-post-screen.test.tsx
git commit -m "feat(app): 글쓰기 화면에 수정 모드를 더한다 (#924)"
```

---

### Task 4: 내 글 ⋮ 메뉴 + 삭제

**Files:**
- Modify: `mobile/app/(tabs)/(community)/posts/[id].tsx`
- Test: `mobile/__tests__/community-detail-menu.test.tsx` (새로 만든다)

**Interfaces:**
- Consumes: Task 2 의 `deletePost` · `ConfirmDialog` — `@/components/ui/confirm-dialog` · `ProductActionSheet`·`type SheetAction` — `@/components/my/product-action-sheet`
- Produces: 없음

**지금 상태:** `isMine` 이 이미 있고(59줄), **내 글에는 ⋮ 를 아예 안 그린다**(189줄 `post && !isMine`). 주석에 「글 지우기는 아직 없다」고 적혀 있다.

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/__tests__/community-detail-menu.test.tsx`

```tsx
// 내 글에는 수정·삭제, 남의 글에는 신고.
//
// ⚠️ 지금까지는 내 글에 ⋮ 가 아예 없었다(「나를 신고할 이유가 없다」).
//    이제 내 글에도 뜬다 — 할 수 있는 일이 생겼기 때문이다.

it('내 글이면 수정·삭제가 보인다', async () => {
  // me.id === post.authorId 가 되게 흉내 낸다
  await render(<CommunityPostDetailScreen />, { wrapper: 감싸기 });

  await fireEvent.press(await screen.findByLabelText('더보기'));

  expect(screen.getByText('게시글 수정')).toBeTruthy();
  expect(screen.getByText('게시글 삭제')).toBeTruthy();
});

it('남의 글이면 신고만 보인다', async () => {
  await render(<CommunityPostDetailScreen />, { wrapper: 감싸기 });

  await fireEvent.press(await screen.findByLabelText('더보기'));

  expect(screen.getByText('게시글 신고하기')).toBeTruthy();
  expect(screen.queryByText('게시글 삭제')).toBeNull();
});

it('삭제를 누르면 확인창을 거친다', async () => {
  await render(<CommunityPostDetailScreen />, { wrapper: 감싸기 });
  await fireEvent.press(await screen.findByLabelText('더보기'));

  await fireEvent.press(screen.getByText('게시글 삭제'));

  expect(screen.getByText('게시글 삭제')).toBeTruthy();
  expect(screen.getByText('정말로 이 게시글을 삭제하시겠습니까?')).toBeTruthy();
  expect(deletePost).not.toHaveBeenCalled();
});
```

**흉내 내는 부분은 이렇게 만든다.** `community-post-screen.test.tsx` 의 `jest.mock` 방식을 본뜬 것이다.

```tsx
let 화면인자: Record<string, string> = { id: '39' };
let 내아이디 = 7;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => 화면인자,
}));

// 내 글인지 아닌지를 이 값으로 가른다(화면이 me.id === post.authorId 로 본다)
jest.mock('@/hooks/use-me', () => ({
  useMe: () => ({ data: { id: 내아이디 }, isLoading: false }),
}));

jest.mock('@/lib/community', () => ({
  ...jest.requireActual('@/lib/community'),
  fetchPostDetail: jest.fn(),
  fetchComments: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/community-post', () => ({
  ...jest.requireActual('@/lib/community-post'),
  deletePost: jest.fn(),
}));

const { fetchPostDetail } = jest.requireMock('@/lib/community') as { fetchPostDetail: jest.Mock };
const { deletePost } = jest.requireMock('@/lib/community-post') as { deletePost: jest.Mock };

beforeEach(() => {
  화면인자 = { id: '39' };
  내아이디 = 7;
  deletePost.mockReset();
  fetchPostDetail.mockResolvedValue({
    id: 39,
    authorId: 7,          // ← 내아이디와 같으면 내 글
    authorNickname: '나',
    authorProfileImageUrl: null,
    title: '캣타워 질문',
    content: '상태가 궁금해요',
    imageUrls: [],
    viewCount: 0,
    commentCount: 0,
    boardType: 'QUESTION',
  });
});

/** 남의 글로 만든다 */
function 남의글로() {
  내아이디 = 99;
}
```

⚠️ 「남의 글이면 신고만」 시험에서는 `남의글로()` 를 먼저 부른다.
⚠️ 이 화면이 실제로 무엇을 부르는지는 **파일을 열어 확인한다.** 위 목록에 없는 조회가 있으면 더한다 — 안 그러면 시험이 그 자리에서 죽는다.
⚠️ `useMe` 가 돌려주는 모양(`{ data, isLoading }`)도 `mobile/hooks/use-me.ts` 를 열어 맞춘다.

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest __tests__/community-detail-menu.test.tsx
```

- [ ] **Step 3: 메뉴와 삭제를 붙인다**

```
① 189줄의 `post && !isMine` 을 `post` 로 바꾼다 — 내 글에도 ⋮ 를 그린다
   ⚠️ 그 위 주석(「내 글에는 ⋮ 를 안 그린다 — 나를 신고할 이유가 없다」)도 고친다.
      낡은 설명을 남기면 다음 사람이 되돌린다

② sheetActions 를 갈래로 만든다
   내 글    「게시글 수정」 → router.push({ pathname: '/community-post', params: { postId } })
            「게시글 삭제」 → 확인창을 연다
   남의 글   「게시글 신고하기」 (지금 것 그대로)

③ ConfirmDialog 를 더한다 — 문구는 웹과 같게
   heading="게시글 삭제"
   description="정말로 이 게시글을 삭제하시겠습니까?"
   confirmLabel="삭제"
   tone="danger"          ← 되돌릴 수 없는 일에만 쓴다

④ 지우고 나면
   await deletePost(post.id)
   await queryClient.invalidateQueries({ queryKey: ['communityPosts'] })
   showToast('게시글을 삭제했습니다')     ⚠️ 댓글 삭제가 쓰는 말투와 맞춘다
                                        (comment-menu-sheet.tsx:73 「댓글을 삭제했습니다」)
   router.back()
```

⚠️ **실패하면 창을 닫지 마라.** `ConfirmDialog` 는 던지지 않으면 닫는다 — 채팅방 나가기가 그 처리를 해 뒀다(`chat/[id].tsx:349` 주석). 다시 시도할 수 있어야 한다.

- [ ] **Step 4: 게이트를 돌린다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 커밋**

```bash
git add "mobile/app/(tabs)/(community)/posts/[id].tsx" mobile/__tests__/community-detail-menu.test.tsx
git commit -m "feat(app): 내 글에 수정·삭제 메뉴 (#924)"
```

---

### Task 5: 게이트 + 실기기 확인

- [ ] **Step 1: 게이트를 돌린다**

```bash
pnpm gate:mobile
```

- [ ] **Step 2: 실기기로 본다**

```
① 내 글을 연다 → ⋮ 에 「게시글 수정」·「게시글 삭제」가 있는가
② 남의 글을 연다 → ⋮ 에 「게시글 신고하기」만 있는가
③ 수정 → 원래 제목·본문·게시판이 채워져 있는가
④ 수정 → **본문에 있던 사진이 사진 칸에 보이는가**          ⭐ 이 과제의 알맹이
⑤ 사진을 하나 지우고 저장 → 글에서도 사라졌는가
⑥ 사진을 하나 더하고 저장 → 글에 붙었는가
⑦ 저장 뒤 상세로 돌아와 바뀐 내용이 바로 보이는가
⑧ 목록에도 바뀐 제목·썸네일이 보이는가
⑨ 삭제 → 확인창이 뜨는가 · 취소하면 안 지워지는가
⑩ 삭제 확인 → 목록으로 돌아가고 그 글이 사라졌는가
⑪ **웹에서 그 글을 열어 똑같이 보이는가**                   ⭐ 매체가 안 갈리는지
⑫ 웹에서 글 중간에 사진을 넣어 쓴 글을 앱에서 수정 →
   사진이 끝으로 밀리는가 (의도한 대가. 글자는 안 사라져야 한다)
```

⚠️ ⑫는 **버그가 아니라 확인**이다. 설계에서 받아들이기로 한 대가다.

- [ ] **Step 3: PR 을 올린다**

```bash
git push -u origin feat/924--post-edit-delete
```

PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 를 **열어서** 그대로 따른다. 관련 이슈는 목록 항목으로 `- Close #924`.

---

## 마지막에 남길 것

- [ ] 사진이 글 중간에 있던 글을 고칠 때 밀리는 것을 **PR 본문에 적는다** — 리뷰어가 버그로 볼 수 있다
- [ ] 화면이 300줄을 넘으면 「채우는 일」을 훅으로 뺄지 생각한다(설계 문서에 적어 뒀다)
