# 앱 내 목록 3종 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마이페이지에서 들어가는 목록 화면 셋(찜한 상품 · 판매 내역 · 구매 내역)을 만들고, 상품 카드 썸네일에 찜 버튼을 달아 홈과 찜 목록에서 바로 찜을 켜고 끌 수 있게 한다.

**Architecture:** 세 화면은 **공통 껍데기 하나**(`my-product-list.tsx`)를 설정만 바꿔 부른다. 서버가 주는 봉투·항목 타입이 홈 검색과 같아서 `Product` 타입과 `ProductCard`를 그대로 재사용한다. 찜 버튼은 `ProductThumbnail`에 선택적으로 달고, 켤 화면만 넘긴다.

**Tech Stack:** Expo SDK 54 · expo-router 6 · React Native 0.81 · TanStack Query 5 · jest-expo

**설계 문서:** `docs/superpowers/specs/2026-07-28-rn-my-lists-design.md`
**선행 바퀴:** #784 (앱 로그인 + 찜, PR #785 머지 완료)

## Global Constraints

- **Expo SDK는 54로 고정.** 이번 계획에 새 의존성은 없다. 혹시 필요해지면 반드시 `npx expo install <pkg>`(SDK에 맞는 버전을 골라줌). `@latest`나 `pnpm add`로 Expo 패키지를 넣지 말 것.
- **작업 디렉터리**: 앱 명령은 `mobile/`에서, 웹 명령은 저장소 루트에서 실행한다.
- **앱 코드 스타일**: 세미콜론 있음, 작은따옴표, `StyleSheet.create`, import 별칭 `@/`. 주석은 한국어로 **"왜"** 를 적는다(무엇을 하는지는 코드가 말한다). `mobile/lib/auth/api.ts` · `mobile/components/my/section-card.tsx`가 본보기.
  - 예외 주의: `mobile/lib/products.ts`는 2바퀴에 만들어져 **세미콜론이 없다.** 그 파일을 고칠 때만 주변을 따르고, 새 파일은 세미콜론을 쓴다.
- **웹 코드 스타일**: 세미콜론 없음, 작은따옴표, Tailwind v4.
- **색 리터럴**: 새 팔레트를 만들지 말 것. 이번에 쓰는 색은 글자 `#111827`, 보조 글자 `#6B7280`, 흐린 글자 `#9CA3AF`, 테두리 `#E5E7EB`, 배경 `#F9FAFB`, 흰색 `#FFFFFF`, **찜 켜짐 `#FC8181`**뿐이다.
- **헤더 높이 52** — 홈 · 상세 · 마이와 같은 값. 화면 전환 시 위치가 흔들리지 않게 하려는 것이니 새 화면도 52를 쓴다.
- **범위 밖**: 거래 상태 필터, 상태 변경, 수정, 삭제, 차단 유저, 내 글. 이 계획에서 만들지 않는다.
- **검증 명령**
  - 앱 타입체크: `cd mobile && npx tsc --noEmit`
  - 앱 테스트: `cd mobile && npx jest`
  - 앱 린트: `cd mobile && npx expo lint`
  - 웹 타입체크: `npx tsc --noEmit` (저장소 루트)
  - 웹 린트(변경 파일만): `npx eslint <파일들>`

---

## File Structure

**앱 — 새로 만드는 파일**

| 경로 | 책임 |
|---|---|
| `mobile/lib/my-lists.ts` | 내 목록 3종 조회. **이 파일만 `/profile/me/*` 주소를 안다** |
| `mobile/lib/my-lists.test.ts` | 위 테스트 |
| `mobile/components/my/my-product-list.tsx` | 목록 화면 공통 껍데기(헤더 · 무한스크롤 · 3상태) |
| `mobile/app/(tabs)/(my)/my-favorites.tsx` | 찜한 상품 |
| `mobile/app/(tabs)/(my)/my-products.tsx` | 판매 내역 |
| `mobile/app/(tabs)/(my)/my-purchases.tsx` | 구매 내역 |

**앱 — 고치는 파일**

| 경로 | 무엇을 |
|---|---|
| `mobile/components/list-states.tsx` | `EmptyState` · `ErrorState` 문구를 prop으로(기본값은 지금 문구) |
| `mobile/components/product-thumbnail.tsx` | 썸네일 위 오른쪽 상단에 선택적 찜 버튼 |
| `mobile/components/product-card.tsx` | 찜 관련 prop을 썸네일로 넘김 |
| `mobile/app/(tabs)/(home)/index.tsx` | 홈 카드의 찜 버튼 켜기 |
| `mobile/app/(tabs)/(my)/index.tsx` | 「내 상품 관리」 카드 3줄 추가 |

**웹 — 고치는 파일**

| 경로 | 무엇을 |
|---|---|
| `src/hooks/useFavorite.ts` | `['myFavorite']` 무효화 제거 |
| `src/features/my-page/MyPage.tsx` | `구매내역` → `구매 내역` 표기 |

---

## Task 1: 내 목록 조회 함수

**Files:**
- Create: `mobile/lib/my-lists.ts`
- Test: `mobile/lib/my-lists.test.ts`

**Interfaces:**
- Consumes: `apiFetch` (from `mobile/lib/auth/api.ts`)
- Produces:
  - `type MyListPage = ProductResponse['data']`
  - `fetchMyFavorites(page: number): Promise<MyListPage>`
  - `fetchMyProducts(page: number): Promise<MyListPage>`
  - `fetchMyPurchases(page: number): Promise<MyListPage>`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `mobile/lib/my-lists.test.ts`:

```ts
// apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchMyFavorites, fetchMyProducts, fetchMyPurchases } from './my-lists';

const mockFetch = jest.fn();

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined;
  return init?.headers?.Authorization;
}

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const emptyPage = {
  code: 'SUCCESS',
  message: 'ok',
  data: { page: 0, size: 20, content: [], hasNext: false },
};

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200, emptyPage));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('내 목록 조회', () => {
  it('찜한 상품은 /profile/me/favorites 를 부른다', async () => {
    await fetchMyFavorites(0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/favorites?page=0&size=20'
    );
  });

  it('판매 내역은 /profile/me/products 를 부른다', async () => {
    await fetchMyProducts(0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/products?page=0&size=20'
    );
  });

  it('구매 내역은 /profile/me/purchase-requests 를 부른다', async () => {
    await fetchMyPurchases(0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/purchase-requests?page=0&size=20'
    );
  });

  it('page 번호가 주소에 반영된다', async () => {
    await fetchMyFavorites(3);

    expect(mockFetch.mock.calls[0][0]).toContain('page=3');
  });

  it('토큰을 붙여 보낸다', async () => {
    // #784에서 products.ts가 토큰 없이 조회해 찜 하트가 도로 꺼졌다.
    // 이 목록들은 셋 다 로그인해야만 볼 수 있으므로 토큰이 없으면 아예 못 받는다.
    await fetchMyFavorites(0);

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token');
  });

  it('응답의 data를 그대로 돌려준다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        code: 'SUCCESS',
        message: 'ok',
        data: { page: 0, size: 20, content: [{ id: 7 }], hasNext: true },
      })
    );

    const result = await fetchMyProducts(0);

    expect(result.content).toHaveLength(1);
    expect(result.hasNext).toBe(true);
  });

  it('실패하면 목록 이름이 담긴 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    await expect(fetchMyPurchases(0)).rejects.toThrow('구매 내역');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/my-lists.test.ts
```

Expected: FAIL — `Cannot find module './my-lists'`

- [ ] **Step 3: 구현**

Create `mobile/lib/my-lists.ts`:

```ts
import type { ProductResponse } from '@cuddle/shared';

import { apiFetch } from './auth/api';

// 마이페이지에서 들어가는 목록 3종의 데이터 소스.
//
// 셋 다 로그인해야 볼 수 있어서 apiFetch로 보낸다(토큰 부착 + 401 갱신).
// 서버가 주는 봉투와 항목 모양이 홈 검색과 완전히 같아서(설계 §4) 타입을 새로 만들지 않고
// ProductResponse를 그대로 쓴다.

/** 목록 한 페이지. 무한스크롤에 content와 hasNext 둘 다 필요하다. */
export type MyListPage = ProductResponse['data'];

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

/**
 * 목록 셋의 다른 점은 주소와 오류 문구뿐이라 한 함수로 모은다.
 * @param label 오류 문구에 넣을 목록 이름. "찜한 상품을 불러오지 못했어요"처럼 쓰인다.
 */
async function fetchMyList(path: string, page: number, label: string): Promise<MyListPage> {
  const res = await apiFetch(`${path}?page=${page}&size=${PAGE_SIZE}`);

  if (!res.ok) {
    throw new Error(`${label}을 불러오지 못했어요 (HTTP ${res.status})`);
  }

  const body: ProductResponse = await res.json();
  return body.data;
}

export function fetchMyFavorites(page: number): Promise<MyListPage> {
  return fetchMyList('/profile/me/favorites', page, '찜한 상품');
}

export function fetchMyProducts(page: number): Promise<MyListPage> {
  return fetchMyList('/profile/me/products', page, '판매 내역');
}

export function fetchMyPurchases(page: number): Promise<MyListPage> {
  return fetchMyList('/profile/me/purchase-requests', page, '구매 내역');
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/my-lists.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 5: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: 출력 없음(오류 0)

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/my-lists.ts mobile/lib/my-lists.test.ts
git commit -m "feat(mobile): 내 목록 3종 조회 함수"
```

---

## Task 2: 빈 상태 · 오류 문구를 화면별로

지금 `EmptyState`와 `ErrorState`는 문구가 하드코딩돼 있어("아직 등록된 상품이 없어요") 목록마다 다른 말을 할 수 없다. **기본값을 지금 문구로 두어 홈은 한 글자도 바뀌지 않게** 하면서 prop을 연다.

**Files:**
- Modify: `mobile/components/list-states.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `EmptyState(props?: { title?: string; description?: string })`
  - `ErrorState(props: { onRetry: () => void; title?: string })`

- [ ] **Step 1: EmptyState를 고친다**

`mobile/components/list-states.tsx`에서 `EmptyState` 함수를 아래로 **교체**한다:

```tsx
interface EmptyStateProps {
  /** 화면마다 다른 한 줄. 넘기지 않으면 홈 문구를 쓴다. */
  title?: string;
  description?: string;
}

/** 빈 상태: 성공했으나 목록 0개. 오류와 명확히 구분. */
export function EmptyState({
  title = '아직 등록된 상품이 없어요.',
  description = '첫 상품이 올라오면 여기에서 보여드릴게요.',
}: EmptyStateProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>🐾</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{description}</Text>
    </View>
  );
}
```

- [ ] **Step 2: ErrorState를 고친다**

같은 파일에서 `ErrorState` 함수를 아래로 **교체**한다:

```tsx
interface ErrorStateProps {
  onRetry: () => void;
  /** 화면마다 다른 한 줄. 넘기지 않으면 홈 문구를 쓴다. */
  title?: string;
}

/** 오류 상태: 첫 로드 실패. 전체 화면 + 다시 시도 버튼. */
export function ErrorState({ onRetry, title = '상품을 불러오지 못했어요.' }: ErrorStateProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>네트워크를 확인하고 다시 시도해 주세요.</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}>
        <Text style={styles.retryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: 홈이 그대로인지 확인**

`mobile/app/(tabs)/(home)/index.tsx`는 `<EmptyState />` · `<ErrorState onRetry={...} />`로 부르고 있다. 기본값을 넣었으므로 **고칠 것이 없다.** 파일을 열어 호출부가 그대로인지 눈으로 확인만 한다.

- [ ] **Step 4: 타입체크 + 린트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

Expected: 타입 오류 0, 린트 exit 0

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/list-states.tsx
git commit -m "refactor(mobile): 빈 상태·오류 문구를 화면별로 바꿀 수 있게"
```

---

## Task 3: 썸네일 찜 버튼 + 홈에 적용

**Files:**
- Modify: `mobile/components/product-thumbnail.tsx`
- Modify: `mobile/components/product-card.tsx`
- Modify: `mobile/app/(tabs)/(home)/index.tsx`

**Interfaces:**
- Consumes: `useFavorite` (from `mobile/hooks/use-favorite.ts`), `IconSymbol`
- Produces:
  - `interface FavoriteControl { isFavorite: boolean; onToggle: () => void; disabled?: boolean }`
  - `<ProductThumbnail ... favorite?: FavoriteControl />`
  - `<ProductCard product favorite?: FavoriteControl />`

> **왜 카드가 `useFavorite`을 직접 부르지 않나:** 훅은 `productId` 하나마다 mutation을 만든다. 카드가 직접 부르면 목록의 모든 카드가 훅을 갖게 되고, 찜을 안 쓰는 화면(판매·구매)에서도 훅이 돈다. 대신 **쓰는 화면이 훅을 부르고 결과만 넘긴다.**

- [ ] **Step 1: 썸네일에 찜 버튼 자리 만들기**

`mobile/components/product-thumbnail.tsx`의 import와 Props, 렌더를 아래로 고친다.

import 줄에 `Pressable`과 `IconSymbol`을 더한다:

```tsx
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { getOverlay } from '@/lib/tradeStatus';
```

Props를 아래로 교체한다:

```tsx
/** 찜 버튼을 그릴지, 그린다면 무엇을 보여주고 누르면 뭘 할지. */
export interface FavoriteControl {
  isFavorite: boolean;
  onToggle: () => void;
  /** 요청이 도는 동안 연타를 막는다. */
  disabled?: boolean;
}

interface Props {
  imageUrl: string;
  tradeStatus: string | null;
  productType: string;
  /**
   * 넘기면 썸네일 오른쪽 위에 찜 버튼이 붙는다.
   * 목록에서 바로 찜을 켜고 끄는 화면(홈 · 찜한 상품)만 넘긴다.
   * 판매 · 구매 내역은 관리용 화면이라 넘기지 않는다(설계 §5).
   */
  favorite?: FavoriteControl;
}

export function ProductThumbnail({ imageUrl, tradeStatus, productType, favorite }: Props) {
```

- [ ] **Step 2: 찜 버튼을 그린다**

같은 파일에서 `{overlay && (...)}` 블록 **바로 아래**, `</View>` 앞에 넣는다:

```tsx
      {favorite && (
        // 오버레이(스크림) 위에 오도록 마지막에 그린다.
        // 바깥 카드가 "누르면 상세로"인데, 이 Pressable이 터치를 먼저 받아 상세로 넘어가지 않는다.
        <Pressable
          onPress={favorite.onToggle}
          disabled={favorite.disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: favorite.isFavorite }}
          accessibilityLabel={favorite.isFavorite ? '찜 해제' : '찜하기'}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}
        >
          <IconSymbol
            name={favorite.isFavorite ? 'heart.fill' : 'heart'}
            size={20}
            // 안 찜한 상태는 흰색이다. 사진 위라 회색은 밝은 사진에서 묻힌다(설계 §5).
            color={favorite.isFavorite ? '#FC8181' : '#FFFFFF'}
            style={styles.favoriteIcon}
          />
        </Pressable>
      )}
```

- [ ] **Step 3: 찜 버튼 스타일 추가**

같은 파일 `StyleSheet.create({ ... })` 안, `pillText` 뒤에 넣는다:

```tsx
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritePressed: {
    opacity: 0.6,
  },
  favoriteIcon: {
    // 밝은 사진 위에서도 흰 하트가 보이도록 옅은 그림자(웹의 drop-shadow-md에 해당).
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
```

- [ ] **Step 4: 카드가 찜 설정을 넘기게 한다**

`mobile/components/product-card.tsx`에서 import·Props·썸네일 호출을 고친다.

import 줄:

```tsx
import { ProductThumbnail, type FavoriteControl } from '@/components/product-thumbnail';
```

Props와 함수 시그니처:

```tsx
interface Props {
  product: Product;
  /** 넘기면 썸네일에 찜 버튼이 붙는다. 카드는 그대로 전달만 한다. */
  favorite?: FavoriteControl;
}

export function ProductCard({ product, favorite }: Props) {
```

썸네일 호출:

```tsx
      <ProductThumbnail
        imageUrl={product.mainImageUrl}
        tradeStatus={product.tradeStatus}
        productType={product.productType}
        favorite={favorite}
      />
```

파일 상단 주석의 `찜="찜 N" 텍스트(표시전용, 토글 X)` 한 줄도 아래로 고친다:

```tsx
// 찜="찜 N" 텍스트는 개수(정보). 켜고 끄는 것은 썸네일 위 찜 버튼이 맡는다(설계 §5).
```

- [ ] **Step 5: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: 출력 없음. (아직 아무도 `favorite`을 넘기지 않으므로 홈은 그대로 돈다)

- [ ] **Step 6: 홈 카드에 찜 버튼 켜기**

`mobile/app/(tabs)/(home)/index.tsx`를 고친다.

import에 훅을 더한다:

```tsx
import { useFavorite } from '@/hooks/use-favorite';
```

`renderItem`이 부르는 **행 컴포넌트를 파일 안에 새로 만든다.** 훅은 컴포넌트 안에서만 부를 수 있어서, `renderItem` 안에서 직접 `useFavorite`을 쓸 수 없다. 파일 맨 아래 `const styles = ...` **앞**에 넣는다:

```tsx
/**
 * 목록의 한 줄. 카드마다 훅이 필요해 별도 컴포넌트로 뺀다
 * (renderItem 안에서는 훅을 부를 수 없다).
 */
function HomeRow({ product }: { product: Product }) {
  const router = useRouter();
  const { toggle, isPending } = useFavorite(product.id);

  return (
    <Pressable
      onPress={() => router.push(`/products/${product.id}`)}
      // 누르는 동안 살짝 흐려져서 눌린 걸 알 수 있게 한다
      style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
    >
      <ProductCard
        product={product}
        favorite={{
          isFavorite: product.isFavorite === true,
          onToggle: toggle,
          disabled: isPending,
        }}
      />
    </Pressable>
  );
}
```

`renderItem`을 아래로 바꾼다:

```tsx
        renderItem={({ item }) => <HomeRow product={item} />}
```

- [ ] **Step 7: 타입체크 + 린트 + 전체 테스트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Expected: 타입 오류 0, 린트 exit 0, 테스트 전부 통과

- [ ] **Step 8: 실기기 확인**

```bash
cd mobile && pnpm expo start
```

Expo Go로 열고 확인:

- 홈 카드 오른쪽 위에 하트가 보인다. 밝은 사진 위에서도 보인다
- **하트를 누르면 상세로 넘어가지 않고** 하트만 켜진다(분홍)
- 카드의 다른 곳을 누르면 상세로 간다
- 상세에서 찜을 끄고 뒤로 나오면 홈 카드의 하트도 꺼져 있다(캐시가 같이 갱신됨)

- [ ] **Step 9: 커밋**

```bash
git add mobile/components/product-thumbnail.tsx mobile/components/product-card.tsx "mobile/app/(tabs)/(home)/index.tsx"
git commit -m "feat(mobile): 상품 카드 썸네일에 찜 버튼 + 홈에 적용"
```

---

## Task 4: 목록 화면 껍데기 + 찜한 상품

껍데기를 만들고 **첫 화면 하나를 끝까지** 붙인다. 여기까지 되면 나머지 둘은 복제다.

**Files:**
- Create: `mobile/components/my/my-product-list.tsx`
- Create: `mobile/app/(tabs)/(my)/my-favorites.tsx`
- Modify: `mobile/app/(tabs)/(my)/index.tsx`

**Interfaces:**
- Consumes: Task 1(`fetchMyFavorites`, `MyListPage`), Task 2(`EmptyState`·`ErrorState` 문구 prop), Task 3(`FavoriteControl`)
- Produces: `<MyProductList title queryKey fetchPage emptyTitle emptyDescription errorTitle showFavorite? />`

- [ ] **Step 1: 껍데기 작성**

Create `mobile/components/my/my-product-list.tsx`:

```tsx
import type { Product } from '@cuddle/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingState,
} from '@/components/list-states';
import { ProductCard } from '@/components/product-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorite } from '@/hooks/use-favorite';
import type { MyListPage } from '@/lib/my-lists';

// 마이 목록 화면 셋(찜한 상품 · 판매 내역 · 구매 내역)의 공통 껍데기.
//
// 세 화면은 제목 · 조회 함수 · 쿼리 키 · 빈 상태 문구 · 찜 버튼 유무만 다르다.
// 껍데기를 하나 두면 5바퀴에서 거래 상태 필터를 넣을 때도 여기 한 곳만 고치면 된다.

const HEADER_HEIGHT = 52; // 홈 · 상세 · 마이와 같은 값

interface Props {
  title: string;
  queryKey: readonly unknown[];
  fetchPage: (page: number) => Promise<MyListPage>;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  /** 찜한 상품 화면만 켠다. 판매 · 구매는 관리용이라 끈다(설계 §5). */
  showFavorite?: boolean;
}

/** 카드를 감싸 "누르면 상세로"를 붙인다. 찜 버튼 유무와 상관없는 공통 부분. */
function RowShell({ productId, children }: { productId: number; children: ReactNode }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/products/${productId}`)}
      style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
    >
      {children}
    </Pressable>
  );
}

/** 찜 버튼이 없는 줄(판매 · 구매). */
function PlainRow({ product }: { product: Product }) {
  return (
    <RowShell productId={product.id}>
      <ProductCard product={product} />
    </RowShell>
  );
}

/**
 * 찜 버튼이 있는 줄(찜한 상품).
 *
 * 왜 줄 컴포넌트를 둘로 나누나:
 * useFavorite은 상품 하나마다 mutation을 만든다. 한 컴포넌트에서 조건부로 부를 수는 없으니
 * (훅 규칙), 찜을 안 쓰는 화면에서 훅이 아예 돌지 않게 하려면 컴포넌트를 나눠야 한다.
 * renderItem 안에서 훅을 부를 수 없다는 제약도 이렇게 함께 풀린다.
 */
function FavoriteRow({ product }: { product: Product }) {
  const { toggle, isPending } = useFavorite(product.id);

  return (
    <RowShell productId={product.id}>
      <ProductCard
        product={product}
        favorite={{
          isFavorite: product.isFavorite === true,
          onToggle: toggle,
          disabled: isPending,
        }}
      />
    </RowShell>
  );
}

export function MyProductList({
  title,
  queryKey,
  fetchPage,
  emptyTitle,
  emptyDescription,
  errorTitle,
  showFavorite = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). hasNext=false면 종료. 홈과 같은 규칙.
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const products: Product[] = data?.pages.flatMap((page) => page.content) ?? [];

  // ----- 3상태 렌더 (로딩/오류/빈은 서로 섞지 않음) -----
  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title={errorTitle} />;
    if (products.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) =>
          showFavorite ? <FavoriteRow product={item} /> : <PlainRow product={item} />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 12 }]}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더를 직접 그리는 이유는 상세 · 로그인과 같다:
          native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다. */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backPressed: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
```

- [ ] **Step 2: 찜한 상품 화면 작성**

Create `mobile/app/(tabs)/(my)/my-favorites.tsx`:

```tsx
import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyFavorites } from '@/lib/my-lists';

// 찜한 상품. 여기서만 카드에 찜 버튼을 켠다 —
// 찜을 빼는 것이 이 화면의 주 목적이다(설계 §5).

export default function FavoritesScreen() {
  return (
    <MyProductList
      title="찜한 상품"
      queryKey={['my', 'favorites']}
      fetchPage={fetchMyFavorites}
      emptyTitle="찜한 상품이 없어요."
      emptyDescription="마음에 드는 상품에 하트를 눌러보세요."
      errorTitle="찜한 상품을 불러오지 못했어요."
      showFavorite
    />
  );
}
```

- [ ] **Step 3: 마이페이지에 「내 상품 관리」 카드 추가**

`mobile/app/(tabs)/(my)/index.tsx`의 `<SectionCard title="고객지원">` **바로 위**에 넣는다:

```tsx
        {/* 웹 모바일 마이페이지와 같은 묶음·이름. 웹은 「구매내역」으로 붙여 썼는데
            나머지 둘은 띄어써서, 여기서는 띄어쓰고 웹 표기도 함께 고친다. */}
        <SectionCard title="내 상품 관리">
          <SectionRow label="판매 내역" onPress={() => router.push('/(tabs)/(my)/my-products')} />
          <SectionRow label="구매 내역" onPress={() => router.push('/(tabs)/(my)/my-purchases')} />
          <SectionRow label="찜한 상품" onPress={() => router.push('/(tabs)/(my)/my-favorites')} />
        </SectionCard>
```

> **경로에 `/(tabs)/(my)`를 붙이는 이유:** #784에서 `router.navigate('/')`가 홈과 마이 양쪽을 가리켜 이동이 무시된 적이 있다. 그룹 이름까지 적어 어느 화면인지 못 박는다. 판매 · 구매 화면은 Task 5에서 만들므로 이 시점에는 두 줄이 아직 갈 곳이 없다 — Task 5까지 마친 뒤 눌러본다.

- [ ] **Step 4: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: `/(tabs)/(my)/my-products` · `/(tabs)/(my)/my-purchases` 가 아직 없어 **라우트 타입 오류가 날 수 있다.** 그 경우 Task 5를 먼저 끝내고 이 단계를 다시 실행한다. 다른 오류가 나면 그건 고쳐야 한다.

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/my/my-product-list.tsx "mobile/app/(tabs)/(my)/my-favorites.tsx" "mobile/app/(tabs)/(my)/index.tsx"
git commit -m "feat(mobile): 마이 목록 껍데기 + 찜한 상품 화면"
```

---

## Task 5: 판매 내역 · 구매 내역

껍데기가 있으니 설정만 바꾼 화면 둘이다.

**Files:**
- Create: `mobile/app/(tabs)/(my)/my-products.tsx`
- Create: `mobile/app/(tabs)/(my)/my-purchases.tsx`

**Interfaces:**
- Consumes: Task 1(`fetchMyProducts`, `fetchMyPurchases`), Task 4(`MyProductList`)
- Produces: 없음 (화면)

- [ ] **Step 1: 판매 내역 화면**

Create `mobile/app/(tabs)/(my)/my-products.tsx`:

```tsx
import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyProducts } from '@/lib/my-lists';

// 내가 등록한 판매 상품. 관리용 화면이라 찜 버튼을 켜지 않는다 —
// 5바퀴에서 이 자리에 거래 상태 변경 · 삭제가 들어온다(설계 §5).

export default function MyProductsScreen() {
  return (
    <MyProductList
      title="판매 내역"
      queryKey={['my', 'products']}
      fetchPage={fetchMyProducts}
      emptyTitle="등록한 상품이 없어요."
      emptyDescription="상품을 등록하면 여기에서 볼 수 있어요."
      errorTitle="판매 내역을 불러오지 못했어요."
    />
  );
}
```

- [ ] **Step 2: 구매 내역 화면**

Create `mobile/app/(tabs)/(my)/my-purchases.tsx`:

```tsx
import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyPurchases } from '@/lib/my-lists';

// 내가 등록한 구매 요청. 판매 내역과 같은 이유로 찜 버튼을 켜지 않는다(설계 §5).

export default function MyPurchasesScreen() {
  return (
    <MyProductList
      title="구매 내역"
      queryKey={['my', 'purchases']}
      fetchPage={fetchMyPurchases}
      emptyTitle="구매 요청한 상품이 없어요."
      emptyDescription="구매 요청을 올리면 여기에서 볼 수 있어요."
      errorTitle="구매 내역을 불러오지 못했어요."
    />
  );
}
```

- [ ] **Step 3: 타입체크 + 린트 + 전체 테스트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Expected: 타입 오류 0(Task 4 Step 4에서 라우트 오류가 났다면 여기서 사라진다), 린트 exit 0, 테스트 전부 통과

- [ ] **Step 4: 커밋**

```bash
git add "mobile/app/(tabs)/(my)/my-products.tsx" "mobile/app/(tabs)/(my)/my-purchases.tsx"
git commit -m "feat(mobile): 판매 내역 · 구매 내역 화면"
```

---

## Task 6: 웹 — 찜 목록에서 항목이 남게 + 표기 정리

**Files:**
- Modify: `src/hooks/useFavorite.ts`
- Modify: `src/features/my-page/MyPage.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (동작 변경)

- [ ] **Step 1: 찜 목록 무효화 제거**

`src/hooks/useFavorite.ts`의 `onSuccess`를 아래로 고친다:

```ts
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      // 찜 목록은 일부러 무효화하지 않는다.
      // 하트를 끄자마자 항목이 사라지면 실수로 눌렀을 때 되돌릴 방법이 없다.
      // 자리에 남겨두면 한 번 더 눌러 복구할 수 있고, 화면을 나갔다 오면 정리된다.
      // 앱도 같은 규칙이다(설계 §5).
    },
```

- [ ] **Step 2: 표기 정리**

`src/features/my-page/MyPage.tsx`에서 `구매내역`을 찾아 `구매 내역`으로 고친다. 같은 묶음의 `판매 내역` · `찜한 상품`은 띄어쓰기가 되어 있어 이것만 어긋나 있다.

```bash
grep -n "구매내역" src/features/my-page/MyPage.tsx
```

- [ ] **Step 3: 타입체크 + 린트**

```bash
npx tsc --noEmit
npx eslint src/hooks/useFavorite.ts src/features/my-page/MyPage.tsx
```

Expected: 타입 오류 0. eslint는 exit 0(`MyPage.tsx`의 `'Link' 미사용` 경고 1건은 이전부터 있던 것이라 그대로 둔다)

- [ ] **Step 4: 웹 손 확인**

```bash
pnpm dev
```

브라우저 폭을 768px 미만으로 줄이고 로그인한 뒤:

- `/mypage` → 「내 상품 관리」의 세 줄 이름이 `판매 내역` · `구매 내역` · `찜한 상품`인지
- 「찜한 상품」 → 하트를 끈다 → **항목이 자리에 남고 하트만 꺼지는지**
- 뒤로 나갔다 다시 들어오면 그 항목이 사라져 있는지

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useFavorite.ts src/features/my-page/MyPage.tsx
git commit -m "fix(web): 찜 해제 시 목록에서 즉시 사라지지 않게 + 구매 내역 표기"
```

---

## 마무리 검증

- [ ] **통합 게이트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
cd .. && npx tsc --noEmit
npx eslint $(git diff --name-only develop...HEAD -- 'src/**/*.ts' 'src/**/*.tsx')
```

Expected: 앱 타입 0 · 린트 exit 0 · 테스트 전부 통과 / 웹 타입 0 · 변경 파일 eslint 오류 0

- [ ] **실기기 손 검증 (설계 §8)**

1. 마이 → 「내 상품 관리」의 세 줄이 보인다
2. 각 화면 진입 → 목록이 뜬다, **탭바가 유지된다**
3. 스크롤 끝까지 → 다음 페이지가 이어 붙는다
4. **홈 카드의 하트를 누른다** → 상세로 넘어가지 않고 하트만 켜진다
5. 그 상품이 찜한 상품 목록에 있다
6. 찜한 상품에서 하트 끄기 → **항목이 자리에 남고 하트만 꺼진다**
7. 뒤로 나갔다 다시 들어오기 → 그 항목이 사라져 있다
8. **판매 내역 · 구매 내역에는 하트가 없다**
9. 항목 탭 → 상품 상세로 이동, 뒤로 오면 목록 자리 유지
10. 빈 상태 문구 (해당 목록이 비어 있는 계정으로)

- [ ] **잔여물 검사**

```bash
grep -rn "개발용\|TODO(\|console.log" mobile/app mobile/components mobile/lib
```

Expected: 출력 없음

- [ ] **PR 생성**

base는 `develop`, 저장소 템플릿(`.github/PULL_REQUEST_TEMPLATE.md`) 형식, 본문에 `Close #<이슈번호>`.
이슈는 착수 전에 `/create-issue`로 먼저 만든다.

---

## 이 계획이 끝나면 (다음 바퀴 준비)

- **5바퀴**: 거래 상태 변경(`PATCH /products/{id}/trade-status`) + 삭제(`DELETE /products/{id}`) + 거래 상태 필터. 판매 · 구매 화면에 붙는다. `MyProductList` 껍데기 한 곳만 고치면 세 화면에 동시에 반영된다.
- **6바퀴**: 상품 등록 · 수정 화면. 그때 목록에 「수정」을 연결한다. 착수 전에 "앱에 정말 필요한가"부터 다시 본다(이미지 업로드가 딸려온다).
