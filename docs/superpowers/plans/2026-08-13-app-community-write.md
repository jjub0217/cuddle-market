# 앱 커뮤니티 글쓰기 구현 계획 (#915)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에서 커뮤니티 글을 쓸 수 있게 한다 — 제목·본문·게시판·사진 최대 5장.

**Architecture:** 사용자는 글과 사진을 **따로** 다루고, 보낼 때 본문 끝에 `![](주소)` 를 이어 붙인다. 서버가 목록 썸네일을 **본문 마크다운에서 뽑기** 때문이다. 사진 칸은 상품 등록 것을 갈라내지 않고 커뮤니티용을 따로 만든다(대표 지정이 얽혀 있다).

**Tech Stack:** Expo SDK 54 · React Native 0.81.5 · expo-router · Jest(jest-expo) + RNTL 14

설계 문서: `docs/superpowers/specs/2026-08-13-app-community-write-design.md`

## Global Constraints

```
브랜치        feat/915--app-community-write  (origin/develop 에서 딴다)
PR base       develop · 관련 이슈는 목록 항목으로 `- Close #915`
새 의존성      0 개. package.json 을 고치지 마라 — 바꾸면 EAS 빌드로 다시 확인해야 한다
서버 한계      제목 2~50자 · 본문 2~1000자 · 사진 최대 5장 · boardType 은 QUESTION | INFO
문구          웹에서 쓰는 말을 그대로 쓴다. 새로 짓지 마라
게이트        저장소 루트에서 `pnpm gate:mobile` (⚠️ `cd mobile` 뒤 루트 명령은 실패한다)
```

⚠️ **`render`·`rerender`·`fireEvent` 는 셋 다 `await` 해야 한다**(RNTL 14). 안 그러면 오류 없이 옛 값을 줘서 **시험이 조용히 틀린 것을 통과시킨다**(`mobile/AGENTS.md`).

⚠️ **`app/` 안에 시험 파일을 두지 마라.** expo-router 가 화면으로 보고 번들에 끼워 넣어 **실기기가 아예 안 뜬다.** 화면 시험은 `mobile/__tests__/` 에 두고 `@/app/...` 로 불러온다.

⚠️ **글쓰기는 루트 화면이다**(탭 안이 아니다). `SafeAreaView` 에 `edges={['top','bottom']}` 를 준다 — 아래에 탭바가 없어 기기 바를 자기가 비켜야 한다.

⚠️ **`KeyboardAvoidingView` 는 안드로이드도 `behavior="padding"`.** `edgeToEdgeEnabled: true` 라 창이 안 줄어든다. 본문 칸과 사진 격자를 **함께** 감싼다.

---

## 파일 구조

```
새로 만든다
  mobile/lib/community-post.ts                     보낼 본문을 만드는 순수 함수 + createPost
  mobile/lib/community-post.test.ts
  mobile/components/community/post-image-field.tsx 대표 지정 없는 사진 격자
  mobile/components/community/post-image-field.test.tsx
  mobile/app/community-post.tsx                    글쓰기 화면 (루트)
  mobile/__tests__/community-post-screen.test.tsx  화면 시험 (⚠️ app/ 밖에 둔다)

고친다
  mobile/app/(tabs)/(community)/index.tsx          「＋ 글쓰기」 뜬 단추
```

## 과제 차례

```
Task 1  본문 만들기 + createPost        순수 함수라 시험이 쉽다. 여기가 설계의 알맹이
Task 2  사진 격자                       상품 등록 것을 본뜨되 대표 지정을 뺀다
Task 3  글쓰기 화면                     1·2 를 붙인다
Task 4  목록의 「＋ 글쓰기」 단추          들어가는 길
Task 5  게이트 + 실기기 확인
```

---

### Task 1: 보낼 본문 만들기 + `createPost`

**Files:**
- Create: `mobile/lib/community-post.ts`
- Test: `mobile/lib/community-post.test.ts`

**Interfaces:**
- Consumes: `apiFetch` — `@/lib/api` (다른 lib 이 쓰는 방식을 그대로 따른다. `mobile/lib/community.ts` 를 열어 import 경로를 확인할 것)
- Produces:
  ```ts
  /** 사진 줄 하나가 본문에서 차지하는 길이 */
  export function imageMarkdown(url: string): string
  /** 본문 + 사진들 → 서버로 보낼 content */
  export function buildContent(body: string, imageUrls: string[]): string
  /** 앞으로 더 쓸 수 있는 글자 수. 사진 몫을 뺀 값 */
  export function remainingBodyLength(body: string, imageUrls: string[]): number
  export const MAX_CONTENT_LENGTH = 1000
  export const MAX_TITLE_LENGTH = 50
  export const MIN_LENGTH = 2
  export async function createPost(input: {
    title: string
    body: string
    imageUrls: string[]
    boardType: 'QUESTION' | 'INFO'
  }): Promise<void>
  ```

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/lib/community-post.test.ts`

```ts
import {
  buildContent,
  imageMarkdown,
  MAX_CONTENT_LENGTH,
  remainingBodyLength,
} from './community-post';

// 글쓰기의 알맹이 — 사진을 **본문 마크다운으로** 넣는다.
//
// ⚠️ 서버가 목록 썸네일을 본문 첫 ![](주소) 에서 뽑는다
//    (PostListItemResponse.java:63). imageUrls 로 보내면 썸네일이 안 생긴다.

const A = 'https://cdn/a.webp';
const B = 'https://cdn/b.webp';

describe('본문 만들기', () => {
  it('사진이 없으면 본문 그대로다', () => {
    expect(buildContent('안녕하세요', [])).toBe('안녕하세요');
  });

  it('사진을 본문 끝에 이어 붙인다', () => {
    expect(buildContent('안녕하세요', [A, B])).toBe(
      `안녕하세요\n\n${imageMarkdown(A)}\n${imageMarkdown(B)}`
    );
  });

  it('본문이 비어도 사진만으로 만들 수 있다', () => {
    expect(buildContent('', [A])).toBe(imageMarkdown(A));
  });

  it('앞뒤 빈칸은 떼고 만든다', () => {
    expect(buildContent('  안녕  ', [])).toBe('안녕');
  });
});

describe('남은 글자 수', () => {
  it('사진이 없으면 한계에서 쓴 만큼만 뺀다', () => {
    expect(remainingBodyLength('12345', [])).toBe(MAX_CONTENT_LENGTH - 5);
  });

  // ⚠️ 이걸 안 하면 「999자 썼는데 등록이 안 된다」가 난다.
  //    사진 한 줄이 100자 안팎이라 다섯이면 500자를 먹는다.
  it('사진 몫을 뺀다', () => {
    const 사진몫 = buildContent('', [A, B]).length;
    expect(remainingBodyLength('12345', [A, B])).toBe(MAX_CONTENT_LENGTH - 5 - 사진몫 - 2);
  });

  it('넘치면 음수가 나온다 (화면이 막을 수 있게)', () => {
    const 긴글 = 'ㄱ'.repeat(MAX_CONTENT_LENGTH);
    expect(remainingBodyLength(긴글, [A])).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest lib/community-post.test.ts
```
기대: `Cannot find module './community-post'` 로 실패.

- [ ] **Step 3: 만든다**

`mobile/lib/community-post.ts`

```ts
import { apiFetch } from './api';

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
  boardType: 'QUESTION' | 'INFO';
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
```

⚠️ `readMessage` 는 `mobile/lib/community.ts` 에 이미 있다. **그 파일을 열어** 내보내는지 보고, 안 내보내면 거기서 export 하거나 같은 방식으로 짧게 다시 쓴다. 새 이름을 지어내지 마라.

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm --filter ./mobile exec jest lib/community-post.test.ts
```
기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/community-post.ts mobile/lib/community-post.test.ts
git commit -m "feat(app): 커뮤니티 글 보낼 본문을 만든다 (#915)"
```

---

### Task 2: 사진 격자 (대표 지정 없음)

**Files:**
- Create: `mobile/components/community/post-image-field.tsx`
- Test: `mobile/components/community/post-image-field.test.tsx`

**Interfaces:**
- Consumes: `MAX_IMAGES` · `pickImages` · `shrinkImage` · `uploadOne` · `type UploadSlot` — `@/lib/product-images`
- Produces:
  ```ts
  interface PostImageFieldProps {
    slots: UploadSlot[]
    onChange: (slots: UploadSlot[]) => void
  }
  export function PostImageField(props: PostImageFieldProps): React.ReactElement
  ```
  testID 는 `post-image-0` · `post-image-1` … · 더하기 자리는 `post-image-add`

**먼저 읽을 것:** `mobile/components/products/image-field.tsx` — 격자 모양(`row: flexDirection:'row', flexWrap:'wrap', gap:8`)·올리는 중 표시·다시 시도·지우기가 다 있다. **그 결을 따르되 대표 지정(`makeMain`·별 표시)은 넣지 않는다.**

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/components/community/post-image-field.test.tsx`

```tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import type { UploadSlot } from '@/lib/product-images';

import { PostImageField } from './post-image-field';

// 커뮤니티 글쓰기의 사진 칸.
//
// ⚠️ 상품 등록과 달리 **대표 지정이 없다.** 커뮤니티 글에는 대표 개념이 없고,
//    본문에 넣는 차례가 곧 순서다. 목록 썸네일은 서버가 본문 첫 사진에서 뽑는다.
//
// ⚠️ 사진첩을 여는 것·올리는 것은 여기서 못 덮는다(기기 일이다). 실기기로 봐야 한다.

function 칸(덮어쓰기: Partial<UploadSlot> = {}): UploadSlot {
  return { key: 'k1', localUri: 'file://a.jpg', url: 'https://cdn/a.webp', failed: false, ...덮어쓰기 };
}

it('고른 사진이 없으면 더하기 자리만 보인다', async () => {
  await render(<PostImageField slots={[]} onChange={jest.fn()} />);

  expect(screen.getByTestId('post-image-add')).toBeTruthy();
  expect(screen.queryByTestId('post-image-0')).toBeNull();
});

it('고른 사진을 그린다', async () => {
  await render(<PostImageField slots={[칸(), 칸({ key: 'k2' })]} onChange={jest.fn()} />);

  expect(screen.getByTestId('post-image-0')).toBeTruthy();
  expect(screen.getByTestId('post-image-1')).toBeTruthy();
});

it('몇 장 골랐는지 보여준다', async () => {
  await render(<PostImageField slots={[칸()]} onChange={jest.fn()} />);

  expect(screen.getByText('사진 (1/5)')).toBeTruthy();
});

// 상품 등록과 다른 점을 시험으로 못 박는다.
it('대표 지정은 없다', async () => {
  await render(<PostImageField slots={[칸()]} onChange={jest.fn()} />);

  expect(screen.queryByLabelText('대표 사진으로')).toBeNull();
});

it('다섯 장을 다 고르면 더하기 자리가 사라진다', async () => {
  const 다섯 = [0, 1, 2, 3, 4].map((i) => 칸({ key: `k${i}` }));
  await render(<PostImageField slots={다섯} onChange={jest.fn()} />);

  expect(screen.queryByTestId('post-image-add')).toBeNull();
});
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest components/community/post-image-field.test.tsx
```
기대: `Cannot find module './post-image-field'` 로 실패.

- [ ] **Step 3: 만든다**

`mobile/components/community/post-image-field.tsx` — `image-field.tsx` 를 열어 **격자·썸네일 크기·올리는 중 표시·지우기 단추**를 그대로 본뜨고, 아래만 다르게 한다.

```tsx
// 커뮤니티 글쓰기의 사진 칸. 상품 등록(products/image-field.tsx)과 **같은 격자**다 —
// 앱 안에서 사진 고르는 화면이 두 모양이면 안 된다.
//
// ⚠️ 다른 점 하나: **대표 지정이 없다.** 커뮤니티 글에는 대표 개념이 없고, 본문에 넣는
//    차례가 곧 순서다. 목록 썸네일은 서버가 본문 첫 ![](주소) 에서 뽑는다.
//
// ⚠️ 상품 등록 것을 공용으로 갈라내지 않았다. 거기는 대표 지정이 얽혀 있어 갈라내면
//    상품 등록까지 다시 확인해야 한다. 세 번째 쓰는 곳이 생기면 그때 갈라낸다.
```

뼈대는 아래대로 하고, **스타일 값(`THUMB_SIZE`·`row`·지우기 단추 모양)은 `image-field.tsx` 에서 그대로 옮긴다.** 새로 지어내지 마라 — 두 화면이 달라 보이면 안 된다.

```tsx
import { Image } from 'expo-image';
import { Camera, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { MAX_IMAGES, pickImages, shrinkImage, uploadOne, type UploadSlot } from '@/lib/product-images';

interface PostImageFieldProps {
  slots: UploadSlot[];
  /** ⚠️ 이 조각은 자기 상태를 안 든다. 화면이 slots 를 들고 있어야 남은 글자 수를 셀 수 있다 */
  onChange: (slots: UploadSlot[]) => void;
}

export function PostImageField({ slots, onChange }: PostImageFieldProps) {
  const 남은장수 = MAX_IMAGES - slots.length;

  const 고르기 = async () => {
    const 고른것 = await pickImages(남은장수);
    if (고른것.length === 0) return;

    // 먼저 미리보기부터 그린다 — 올라가는 동안에도 사진이 보여야 한다.
    const 새칸들: UploadSlot[] = 고른것.map((p, i) => ({
      key: `${Date.now()}-${i}`,
      localUri: p.uri,
      url: null,
      failed: false,
    }));
    let 지금 = [...slots, ...새칸들];
    onChange(지금);

    for (const 칸 of 새칸들) {
      try {
        const 줄인것 = await shrinkImage(칸.localUri);
        const 주소 = await uploadOne(줄인것);
        지금 = 지금.map((s) => (s.key === 칸.key ? { ...s, url: 주소 } : s));
      } catch {
        // 그 칸에만 「다시」를 그린다. 나머지는 계속 올린다.
        지금 = 지금.map((s) => (s.key === 칸.key ? { ...s, failed: true } : s));
      }
      onChange(지금);
    }
  };

  const 지우기 = (key: string) => onChange(slots.filter((s) => s.key !== key));

  return (
    <View>
      <Text style={styles.label}>사진 ({slots.length}/{MAX_IMAGES})</Text>
      <View style={styles.row}>
        {slots.map((slot, i) => (
          <View key={slot.key} testID={`post-image-${i}`} style={styles.thumb}>
            <Image source={{ uri: slot.localUri }} style={styles.thumbImage} contentFit="cover" />
            {slot.url === null && !slot.failed ? (
              <View style={styles.cover}>
                <ActivityIndicator color={colors.surface} />
              </View>
            ) : null}
            {slot.failed ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="다시 올리기"
                onPress={고르기}
                style={styles.cover}
              >
                <Text style={styles.retryText}>다시</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 지우기"
              onPress={() => 지우기(slot.key)}
              style={styles.remove}
              hitSlop={8}
            >
              <X size={14} color={colors.surface} />
            </Pressable>
          </View>
        ))}

        {남은장수 > 0 ? (
          <Pressable
            testID="post-image-add"
            accessibilityRole="button"
            accessibilityLabel="사진 더하기"
            onPress={고르기}
            style={styles.add}
          >
            <Camera size={22} color={colors.onSurfaceMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
```

⚠️ `styles` 는 **`image-field.tsx` 것을 옮겨 온다**(`THUMB_SIZE`·`row`·`thumb`·`remove` 등). 거기에 없는 이름(`label`·`cover`·`add`·`retryText`)만 그 결에 맞춰 더한다.
⚠️ `colors.onSurfaceMuted` 같은 이름은 **`constants/colors.ts` 를 열어 실제 있는지 확인**하고 쓴다.

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm --filter ./mobile exec jest components/community/post-image-field.test.tsx
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/community/post-image-field.tsx mobile/components/community/post-image-field.test.tsx
git commit -m "feat(app): 커뮤니티 글쓰기 사진 칸 (#915)"
```

---

### Task 3: 글쓰기 화면

**Files:**
- Create: `mobile/app/community-post.tsx`
- Test: `mobile/__tests__/community-post-screen.test.tsx` (⚠️ `app/` 밖에 둔다)

**Interfaces:**
- Consumes: Task 1 의 `createPost`·`remainingBodyLength`·`MAX_TITLE_LENGTH`·`MIN_LENGTH` · Task 2 의 `PostImageField` · `ScreenHeader` — `@/components/ui/screen-header` · `FilterChip` 칩 조각(목록 화면이 쓰는 것과 같은 것을 쓴다 — `(tabs)/(community)/index.tsx` 를 열어 이름을 확인할 것)
- Produces: 없음 (화면)

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/__tests__/community-post-screen.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CommunityPostScreen from '@/app/community-post';

// ⚠️ 이 시험 파일은 **app/ 밖에** 둔다. expo-router 가 app/ 안의 모든 파일을 화면으로
//    보기 때문에, 거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).
//
// ⚠️ render·fireEvent 는 셋 다 기다려야 한다(RNTL 14).

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

it('제목·본문·사진 칸이 있다', async () => {
  await render(<CommunityPostScreen />, { wrapper: Wrapper });

  expect(screen.getByPlaceholderText('제목을 입력해 주세요')).toBeTruthy();
  expect(screen.getByPlaceholderText('내용을 입력하세요')).toBeTruthy();
  expect(screen.getByText('사진 (0/5)')).toBeTruthy();
});

it('제목이 짧으면 등록을 못 누른다', async () => {
  await render(<CommunityPostScreen />, { wrapper: Wrapper });

  await fireEvent.changeText(screen.getByPlaceholderText('제목을 입력해 주세요'), 'ㄱ');
  await fireEvent.changeText(screen.getByPlaceholderText('내용을 입력하세요'), '내용입니다');

  expect(screen.getByRole('button', { name: '등록' }).props.accessibilityState.disabled).toBe(true);
});

it('제목과 본문이 다 차면 등록을 누를 수 있다', async () => {
  await render(<CommunityPostScreen />, { wrapper: Wrapper });

  await fireEvent.changeText(screen.getByPlaceholderText('제목을 입력해 주세요'), '캣타워 질문');
  await fireEvent.changeText(screen.getByPlaceholderText('내용을 입력하세요'), '상태가 궁금해요');

  expect(screen.getByRole('button', { name: '등록' }).props.accessibilityState.disabled).toBe(false);
});

// 웹과 같은 모양(n/1000자)을 쓰되 **사진 몫까지 더한 값**을 보여준다.
// 서버가 세는 것과 같은 숫자라야 「999자인데 왜 안 되지」가 안 생긴다.
it('쓴 글자 수를 웹과 같은 모양으로 보여준다', async () => {
  await render(<CommunityPostScreen />, { wrapper: Wrapper });

  await fireEvent.changeText(screen.getByPlaceholderText('내용을 입력하세요'), '12345');

  expect(screen.getByText('5/1000자')).toBeTruthy();
});
```

⚠️ 위 문구(`제목을 입력해주세요` 등)는 **웹 글쓰기 화면(`CommunityPostForm.tsx`)을 열어 그대로 맞춘다.** 여기 적은 것은 짐작이다 — 다르면 웹을 따르고 시험도 같이 고친다.

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest __tests__/community-post-screen.test.tsx
```
기대: `Cannot find module '@/app/community-post'` 로 실패.

- [ ] **Step 3: 화면을 만든다**

`mobile/app/community-post.tsx`

```tsx
export default function CommunityPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ boardType?: string }>();
  const [boardType, setBoardType] = useState<BoardType>(
    params.boardType === 'INFO' ? 'INFO' : 'QUESTION'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [slots, setSlots] = useState<UploadSlot[]>([]);
  const [보내는중, set보내는중] = useState(false);
  const [오류, set오류] = useState<string | null>(null);

  const 올라간주소들 = slots.map((s) => s.url).filter((u): u is string => u !== null);
  // 웹과 같은 모양(n/1000자)으로 보여주되 **사진 몫까지 더한** 값이다 — 서버가 세는 것과 같다
  const 쓴글자 = MAX_CONTENT_LENGTH - remainingBodyLength(body, 올라간주소들);
  const 남은글자 = remainingBodyLength(body, 올라간주소들);
  // ⚠️ 아직 안 올라간 사진이 있으면 막는다. 안 막으면 본문에 ![](null) 이 들어간다.
  const 올리는중 = slots.some((s) => s.url === null && !s.failed);
  const 보낼수있나 =
    title.trim().length >= MIN_LENGTH &&
    body.trim().length >= MIN_LENGTH &&
    남은글자 >= 0 &&
    !올리는중 &&
    !보내는중;

  const 보내기 = async () => {
    set보내는중(true);
    set오류(null);
    try {
      await createPost({ title, body, imageUrls: 올라간주소들, boardType });
      router.back();
    } catch (e) {
      // 서버 문구를 그대로 살린다 — 차단·권한 같은 것을 사용자가 구별해야 한다.
      set오류(e instanceof Error ? e.message : '글 등록에 실패했어요');
    } finally {
      set보내는중(false);
    }
  };

  return (
    // ⚠️ 루트 화면이라 아래도 비켜야 한다. 탭 화면과 다르다
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="글쓰기"
        icon="back"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="등록"
            accessibilityState={{ disabled: !보낼수있나 }}
            disabled={!보낼수있나}
            onPress={보내기}
          >
            <Text style={[styles.submit, !보낼수있나 && styles.submitOff]}>등록</Text>
          </Pressable>
        }
      />
      {/* ⚠️ 안드로이드도 padding 이다. edgeToEdgeEnabled 라 창이 안 줄어든다.
          본문 칸과 사진 격자를 **함께** 감싼다 — 칸만 감싸면 위쪽이 안 밀린다 */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* 게시판 고르기 — 목록과 같은 칩을 쓴다 */}
          {/* 제목 칸 — placeholder="제목을 입력해 주세요" · maxLength={MAX_TITLE_LENGTH} · 아래에 「n/50」 */}
          {/* 본문 칸 — placeholder="내용을 입력하세요" · multiline · 아래에 「{쓴글자}/1000자」 */}
          <PostImageField slots={slots} onChange={setSlots} />
          {오류 ? <Text style={styles.error}>{오류}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

⚠️ 주석으로 남긴 세 칸(게시판·제목·본문)은 **웹 `CommunityPostForm.tsx` 를 열어 placeholder 와 글자 수 표시 문구를 그대로 가져와** 채운다. 칩은 목록 화면(`(tabs)/(community)/index.tsx`)이 쓰는 조각을 그대로 쓴다.

⚠️ `올리는중` 일 때 등록이 막히면 **왜 막혔는지 알려야 한다.** 「사진을 올리는 중이에요」를 본문 칸 아래나 등록 단추 옆에 띄운다 — 단추만 흐려 두면 이유를 모른다.

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm --filter ./mobile exec jest __tests__/community-post-screen.test.tsx
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/app/community-post.tsx mobile/__tests__/community-post-screen.test.tsx
git commit -m "feat(app): 커뮤니티 글쓰기 화면 (#915)"
```

---

### Task 4: 목록의 「＋ 글쓰기」 단추

**Files:**
- Modify: `mobile/app/(tabs)/(community)/index.tsx`
- Test: `mobile/__tests__/community-list-write-button.test.tsx` (없으면 새로 만든다)

**Interfaces:**
- Consumes: Task 3 의 화면 (`/community-post`)
- Produces: 없음

**먼저 볼 것:** 웹 `src/features/community/CommunityPage.tsx:365-375` — 모바일 폭에서 오른쪽 아래에 뜬 단추 「＋ 글쓰기」다. **자리와 문구를 그대로 따른다.**

- [ ] **Step 1: 실패하는 시험을 쓴다**

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CommunityListScreen from '@/app/(tabs)/(community)/index';
import { useAuthStore } from '@/lib/auth/store';

// 웹 모바일과 같은 자리·같은 문구의 뜬 단추(CommunityPage.tsx:365).
//
// ⚠️ 게스트는 **단추를 누를 때** 로그인으로 보낸다. 화면을 열어 놓고 밀어내면
//    로그인을 취소했을 때 돌아올 자리가 없어진다(마이 탭 주석 참고).

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

it('글쓰기 단추가 있다', async () => {
  useAuthStore.setState({ status: 'authed' });
  await render(<CommunityListScreen />, { wrapper: Wrapper });

  expect(screen.getByRole('button', { name: '글쓰기' })).toBeTruthy();
});
```

⚠️ 목록 화면은 조회를 하므로 시험에서 서버 부르기를 흉내 내야 할 수 있다. **다른 목록 화면 시험이 어떻게 하는지 먼저 보고 같은 방식을 쓴다**(`mobile/__tests__/` 안을 훑을 것).

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm --filter ./mobile exec jest __tests__/community-list-write-button.test.tsx
```

- [ ] **Step 3: 단추를 붙인다**

```
자리      오른쪽 아래에 뜬다. 탭바를 비켜야 한다
          ⚠️ 탭 화면이라 insets.bottom 을 더하지 마라 — 탭바가 이미 비켜 놓았다.
             토스트가 쓰는 값(components/ui/toast-host.tsx)을 보고 맞춘다
모양      ＋ 아이콘 + 「글쓰기」. 웹과 같다
누르면    게스트면 router.push('/login')
          아니면 router.push({ pathname: '/community-post', params: { boardType } })
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/app/\(tabs\)/\(community\)/index.tsx mobile/__tests__/community-list-write-button.test.tsx
git commit -m "feat(app): 커뮤니티 목록에 글쓰기 단추 (#915)"
```

---

### Task 5: 게이트 + 실기기 확인

- [ ] **Step 1: 게이트를 돌린다**

```bash
pnpm gate:mobile
```
기대: tsc·lint·jest 전부 통과.

- [ ] **Step 2: 실기기로 본다**

```
① 커뮤니티 목록 → 오른쪽 아래 「＋ 글쓰기」가 탭바를 안 가리는가
② 로그아웃 상태로 누르면 로그인 화면으로 가는가 · 취소하면 목록으로 돌아오는가
③ 제목·본문을 쓰고 등록 → 목록에 새 글이 보이는가
④ 사진을 넣고 등록 → **목록에 썸네일이 보이는가**            ⭐ 설계의 알맹이
⑤ 그 글을 열면 사진이 본문에 보이는가
⑥ **웹에서 같은 글을 열면 똑같이 보이는가**                  ⭐ 매체가 갈리지 않는지
⑦ 사진을 다섯 장 넣고 긴 글을 쓰면 「n자 남음」이 사진 몫만큼 줄어 있는가
⑧ 사진이 올라가는 중에 등록을 누르면 막히는가
⑨ 키보드가 본문 칸을 가리지 않는가
```

- [ ] **Step 3: PR 을 올린다**

```bash
git push -u origin feat/915--app-community-write
```
PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 를 **열어서** 그대로 따른다. 관련 이슈는 목록 항목으로 `- Close #915`.

---

## 마지막에 남길 것

- [ ] 글 **수정·삭제**는 이번 범위가 아니다. 필요하면 이슈를 따로 연다(제목은 `feat:` 로 시작)
- [ ] 사진 칸을 상품 등록과 공용으로 갈라낼지는 **세 번째 쓰는 곳이 생길 때** 다시 본다
