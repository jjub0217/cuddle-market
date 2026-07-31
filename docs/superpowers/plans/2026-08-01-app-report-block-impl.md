# 앱 신고·차단 구현 계획 (#805)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에 신고와 차단을 넣는다. 차단이 놓일 자리인 판매자 프로필 화면도 함께 만든다.

**Architecture:** 신고·차단 API와 문구를 `mobile/lib/reports.ts` 한 곳에 모아 세 화면(상품 상세·프로필·차단 목록)이 같은 재료를 쓴다. 신고 사유 상수는 `@cuddle/shared`에 올려 웹·앱이 한 곳에서 가져간다. 신고 화면 하나가 상품용·사용자용을 다 그리고, 보낼 때만 모양을 바꾼다.

**Tech Stack:** Expo SDK 54 · React Native · TypeScript · TanStack Query · expo-router · Jest / Next.js 웹

**설계 스펙:** `docs/superpowers/specs/2026-08-01-app-report-block-design.md`

---

## Global Constraints

- **Expo SDK 54 고정.** 새 네이티브 모듈을 넣지 않는다 — 실기기 확인을 Expo Go로 한다
- **`apiFetch`를 고치지 않는다.** 서버가 `@RequestBody`(JSON)를 받는다. FormData가 필요하다는 판단은 틀렸다(스펙 §10-①)
- **상품 신고는 `reasonCodes`(배열), 사용자 신고는 `reasonCode`(문자열)** — 필드 이름이 다르다. 여기서 틀리면 조용히 실패한다
- **문구·사유·색은 웹에서 가져온다.** 새로 짓지 않는다. 웹에 없으면 스펙에 적힌 것만 쓴다
- 상세 사유는 **최대 300자 · 선택**. 신고 사유는 **필수 · 하나만**
- 목록 페이지 크기는 **`size=20`** (`@PageableDefault`와 같은 값)
- 앱 색은 지금 쓰는 무채색 그대로. 웹 브랜드 토큰 매핑은 **#786**에서 다룬다
- 웹에서 `max-w-3xl` 같은 티셔츠 크기를 쓰면 안 된다 — Tailwind v4가 `--spacing-3xl`(48px)로 풀어 폭이 48px이 된다
- 게이트: 앱 `npx tsc --noEmit && npx expo lint && npx jest` / 웹 `npx tsc --noEmit` + 바뀐 파일 `npx eslint`

---

## 순서가 중요하다

```
Task 1 (shared 상수)  ──►  Task 2 (lib/reports)  ──►  Task 4~6, 9 (화면들)
                      └─►  Task 10 (웹 문구)

Task 3 (lib/user-profile) ──► Task 7 (프로필 화면) ──► Task 8 (판매자 카드 연결)
```

**Task 1이 먼저다.** 앱과 웹이 둘 다 거기서 문구를 가져간다.

---

## File Structure

### 공통

| 파일 | 책임 |
|---|---|
| `packages/shared/src/constants/report.ts` | **신설.** 신고 사유 2종 + 차단 안내 문구의 **원본** |
| `packages/shared/src/index.ts` | 위를 내보낸다 |

### 앱

| 파일 | 책임 |
|---|---|
| `mobile/lib/reports.ts` | **신설.** 신고·차단 API 6개 + 오류 판별 |
| `mobile/lib/reports.test.ts` | **신설** |
| `mobile/lib/user-profile.ts` | **신설.** 프로필 3종 조회 |
| `mobile/lib/user-profile.test.ts` | **신설** |
| `mobile/app/report.tsx` | **신설.** 신고 화면 (루트 스택) |
| `mobile/components/report/block-confirm.tsx` | **신설.** 차단 확인 창 |
| `mobile/components/user-profile/profile-head.tsx` | **신설.** 사진·닉네임·지역·소개글·배지 |
| `mobile/components/user-profile/kind-tabs.tsx` | **신설.** [판매상품][판매요청] |
| `mobile/app/(tabs)/(home)/users/[id].tsx` | **신설.** 프로필 화면 본체 |
| `mobile/app/(tabs)/(my)/users/[id].tsx` | **신설.** 위를 re-export |
| `mobile/app/(tabs)/(my)/blocked-users.tsx` | **신설.** 차단 목록 |
| `mobile/components/product-detail/detail-header.tsx` | 오른쪽에 `⋮` 추가 |
| `mobile/components/product-detail/seller-card.tsx` | 누르면 프로필로 |
| `mobile/app/(tabs)/(home)/products/[id].tsx` | `⋮` 시트 · 신고·차단 연결 |
| `mobile/app/(tabs)/(my)/index.tsx` | 「차단 목록」 줄 추가 |
| `mobile/app/_layout.tsx` | `report` 화면 등록 |

### 웹

| 파일 | 책임 |
|---|---|
| `src/constants/constants.ts` | 신고 사유·차단 문구를 shared에서 re-export |

### 왜 `MyProductList`를 안 쓰나

프로필의 상품 목록에 `MyProductList`를 쓰고 싶겠지만 **쓰면 안 된다.** 그 안의 `RowShell`이 이동 경로를 못 박고 있다.

```tsx
router.push(`/(tabs)/(my)/products/${productId}`)   // my 스택으로 고정
```

홈 스택의 프로필에서 상품을 누르면 마이 탭으로 튄다. 게다가 `MyProductList`는 헤더 제목·등록 버튼·상태 필터 칩·관리 시트를 다 안고 있어 프로필에 필요 없는 것이 많다. **프로필 화면 안에 목록을 직접 그린다** — `FlatList` + `ProductCard` + `list-states`면 된다.

---

# Task 1: 신고 사유·차단 문구를 `@cuddle/shared`로

**Files:**
- Create: `packages/shared/src/constants/report.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `src/constants/constants.ts`

**Interfaces:**
- Produces:
  - `interface ReportReason { id: string; label: string }`
  - `PRODUCT_REPORT_REASON: ReportReason[]` — 8개
  - `USER_REPORT_REASON: ReportReason[]` — 7개
  - `USER_BLOCK_ALERT_LIST: string[]` — 3줄 (**새 문구**)

- [ ] **Step 1: 원본 파일을 만든다**

`packages/shared/src/constants/report.ts`

```ts
// 신고 사유와 차단 안내 문구의 원본. 웹과 앱이 여기서 가져간다.
//
// 왜 shared에 두나: 웹 constants.ts에만 있으면 앱이 복사해야 하고, 복사하면
// 한쪽만 고쳐질 자리가 된다. 8바퀴에 앱 문구를 따로 지었다가 갈린 일이 있었다.
//
// POST_REPORT_REASON(커뮤니티 글)은 안 올린다 — 앱에 커뮤니티 화면이 없어 쓸 데가 없다.
// 쓰는 데가 생길 때 올린다.

export interface ReportReason {
  /** 서버 enum 이름. 그대로 보낸다 */
  id: string
  label: string
}

export const PRODUCT_REPORT_REASON: ReportReason[] = [
  { id: 'FALSE_OR_SCAM', label: '허위/사기성 상품' },
  { id: 'ILLEGAL_ITEM', label: '불법 또는 금지 품목' },
  { id: 'INAPPROPRIATE_IMAGE', label: '부적절한 이미지' },
  { id: 'DUPLICATE_POST', label: '중복 게시물' },
  { id: 'SPAM_OR_AD', label: '스팸/광고성 게시물' },
  { id: 'PROXY_PAYMENT_OR_TRADE', label: '대리 결제/구매/판매 행위' },
  { id: 'PROFESSIONAL_SELLER', label: '전문 판매 업자' },
  { id: 'ETC', label: '기타' },
]

export const USER_REPORT_REASON: ReportReason[] = [
  { id: 'HARASSMENT', label: '욕설, 비방, 괴롭힘' },
  { id: 'FRAUD', label: '사기, 허위 거래 시도' },
  { id: 'INAPPROPRIATE_CONTENT', label: '음란물 또는 불건전 행위' },
  { id: 'SPAM', label: '스팸/광고성 메시지' },
  { id: 'OFFENSIVE_PROFILE', label: '불쾌한 사용자 정보 내용' },
  { id: 'UNDERAGE', label: '만 14세 미만 유저' },
  { id: 'OTHER', label: '기타' },
]

/**
 * 차단하면 무슨 일이 생기는지.
 *
 * 전에는 두 줄이 더 있었다 — 「상품을 볼 수 없습니다」와 「게시글과 프로필이 숨김
 * 처리됩니다」. 둘 다 사실이 아니어서 뺐다. 백엔드가 차단을 보는 곳은 채팅과
 * 프로필뿐이고 상품 조회에는 차단 참조가 아예 없다. 실물로도 확인했다(#809).
 *
 * #809가 고쳐지면 그때 두 줄을 되돌린다.
 */
export const USER_BLOCK_ALERT_LIST: string[] = [
  '차단한 사용자는 회원님에게 채팅을 보낼 수 없습니다',
  '이미 진행 중인 거래는 영향을 받지 않습니다',
  '차단은 언제든 차단 목록에서 해제할 수 있습니다',
]
```

> 마지막 줄에서 「마이페이지 >」·「마이 >」를 뺐다. 웹과 앱의 메뉴 이름이 달라(마이페이지 / 마이) 한 문구로는 둘 다 맞출 수 없다. 위치를 빼면 두 곳에서 다 맞는 말이 된다.

- [ ] **Step 2: shared가 내보내게 한다**

`packages/shared/src/index.ts`

```diff
 export * from './types/product'
+export * from './constants/report'
 export * from './lib/format'
```

- [ ] **Step 3: 웹이 shared에서 가져오게 한다**

`src/constants/constants.ts`에서 세 상수의 **정의를 지우고** re-export로 바꾼다.

지울 것 — `USER_REPORT_REASON`(279행 근처), `USER_BLOCK_ALERT_LIST`(289행 근처), `PRODUCT_REPORT_REASON`(297행 근처) 세 블록.

파일 맨 위에 더한다.

```ts
// 신고 사유와 차단 안내 문구는 @cuddle/shared가 원본이다(앱도 같은 것을 쓴다).
// 웹 화면들의 import 경로를 안 바꾸려고 여기서 다시 내보낸다.
export { PRODUCT_REPORT_REASON, USER_REPORT_REASON, USER_BLOCK_ALERT_LIST } from '@cuddle/shared'
export type { ReportReason } from '@cuddle/shared'
```

> `POST_REPORT_REASON`은 **그대로 둔다.** shared에 안 올렸다.

- [ ] **Step 4: 웹 타입·린트를 확인한다**

```bash
npx tsc --noEmit
npx eslint src/constants/constants.ts
```

기대: 오류 0건. `ReportModalBase`가 쓰는 `ReportReason` 타입이 shared 것과 맞아야 한다 — 둘 다 `{ id: string; label: string }`이라 맞는다.

- [ ] **Step 5: 웹 빌드로 확인한다**

```bash
pnpm build
```

기대: 성공. shared는 workspace 패키지라 빌드 시점에 풀린다.

- [ ] **Step 6: 커밋**

```bash
git add packages/shared/src/constants/report.ts packages/shared/src/index.ts src/constants/constants.ts
git commit -m "refactor: 신고 사유·차단 문구를 shared로 올리고 문구를 사실에 맞춤 (#805)"
```

---

# Task 2: 앱 신고·차단 API

**Files:**
- Create: `mobile/lib/reports.ts`
- Test: `mobile/lib/reports.test.ts`

**Interfaces:**
- Consumes: `apiFetch` from `mobile/lib/auth/api.ts`
- Produces:
  - `reportProduct(productId: number, reasonCode: string, detailReason?: string): Promise<void>`
  - `reportUser(userId: number, reasonCode: string, detailReason?: string): Promise<void>`
  - `blockUser(userId: number): Promise<void>`
  - `unblockUser(userId: number): Promise<void>`
  - `interface BlockedUser { userId: number; nickname: string; profileImageUrl: string | null }`
  - `fetchBlockedUsers(page: number): Promise<{ content: BlockedUser[]; hasNext: boolean }>`
  - `isAlreadyReported(error: unknown): boolean`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`mobile/lib/reports.test.ts`

```ts
// apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import {
  blockUser,
  fetchBlockedUsers,
  isAlreadyReported,
  reportProduct,
  reportUser,
  unblockUser,
} from './reports';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 요청에 실린 JSON 본문을 꺼낸다. */
function bodyOf(call: unknown[]): Record<string, unknown> {
  const init = call[1] as { body?: string } | undefined;
  return JSON.parse(init?.body ?? '{}');
}

function methodOf(call: unknown[]): string | undefined {
  return (call[1] as { method?: string } | undefined)?.method;
}

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('reportProduct', () => {
  it('reasonCodes를 배열로 보낸다 — 서버 DTO가 List<String>이다', async () => {
    await reportProduct(42, 'ILLEGAL_ITEM');

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/products/42');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('POST');
    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ reasonCodes: ['ILLEGAL_ITEM'] });
  });

  it('상세 사유가 있으면 함께 보낸다', async () => {
    await reportProduct(42, 'ETC', '가짜예요');

    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({
      reasonCodes: ['ETC'],
      detailReason: '가짜예요',
    });
  });

  it('상세 사유가 비어 있으면 아예 안 보낸다', async () => {
    await reportProduct(42, 'ETC', '   ');

    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ reasonCodes: ['ETC'] });
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(reportProduct(42, 'ETC')).rejects.toThrow();
  });
});

describe('reportUser', () => {
  it('reasonCode를 문자열로 보낸다 — 상품과 필드 이름이 다르다', async () => {
    await reportUser(7, 'HARASSMENT');

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/users/7');
    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ reasonCode: 'HARASSMENT' });
  });
});

describe('blockUser / unblockUser', () => {
  it('차단은 POST', async () => {
    await blockUser(7);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/blocks/users/7');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('POST');
  });

  it('해제는 DELETE', async () => {
    await unblockUser(7);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/blocks/users/7');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('DELETE');
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(blockUser(7)).rejects.toThrow();
  });
});

describe('fetchBlockedUsers', () => {
  it('page와 size=20으로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { content: [], hasNext: false } }));

    await fetchBlockedUsers(1);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/reports/blocks/users?page=1&size=20'
    );
  });

  it('content와 hasNext를 돌려준다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        data: {
          content: [{ userId: 7, nickname: '지니', profileImageUrl: null }],
          hasNext: true,
        },
      })
    );

    const page = await fetchBlockedUsers(0);

    expect(page.content).toHaveLength(1);
    expect(page.content[0].nickname).toBe('지니');
    expect(page.hasNext).toBe(true);
  });
});

describe('isAlreadyReported', () => {
  it('중복 신고 메시지를 알아본다', () => {
    expect(isAlreadyReported(new Error('이미 신고한 상품입니다'))).toBe(true);
    expect(isAlreadyReported(new Error('이미 신고한 사용자입니다'))).toBe(true);
  });

  it('그 밖의 오류는 아니다', () => {
    expect(isAlreadyReported(new Error('서버 내부 오류가 발생했습니다'))).toBe(false);
    expect(isAlreadyReported(null)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 본다**

```bash
cd mobile && npx jest lib/reports.test.ts
```

기대: `Cannot find module './reports'`로 실패.

- [ ] **Step 3: 구현한다**

`mobile/lib/reports.ts`

```ts
import { apiFetch } from './auth/api';

// 신고와 차단을 한 곳에 모은다.
// 상품 상세 · 프로필 · 차단 목록 세 화면이 같은 재료를 쓰므로 흩어지면 어긋난다.
//
// 웹은 상품 신고를 REST + FormData로, 사용자 신고를 GraphQL로 보내 경로가 갈려 있고
// 그중 상품 쪽이 500으로 깨져 있다(#808). 앱은 둘 다 REST + JSON으로 보낸다 —
// 서버가 @RequestBody를 받으므로 그게 맞다.

/**
 * ⚠️ 두 신고 API의 필드 이름이 다르다. 여기서 틀리면 조용히 실패한다.
 *
 *   상품    { reasonCodes: ["ILLEGAL_ITEM"] }   ProductReportRequest.reasonCodes: List<String>
 *   사용자  { reasonCode:  "HARASSMENT"    }   UserReportRequest.reasonCode: String
 *
 * 화면은 어느 쪽이든 사유를 하나만 고르게 한다(웹도 라디오다).
 * 상품 쪽만 보낼 때 배열로 감싼다.
 */
async function postReport(path: string, payload: Record<string, unknown>, label: string) {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(payload) });

  if (!res.ok) {
    // 서버 문구를 그대로 살린다 — "이미 신고한 상품입니다" 같은 것을 화면이 구별해야 한다.
    const message = await readMessage(res);
    throw new Error(message ?? `${label}에 실패했어요 (HTTP ${res.status})`);
  }
}

/** 오류 응답의 message를 꺼낸다. 못 읽으면 null. */
async function readMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { message?: string };
    return body?.message ?? null;
  } catch {
    return null;
  }
}

/** 빈 문자열·공백만 있는 상세 사유는 아예 안 보낸다(서버에서 선택 필드다). */
function trimmed(detailReason?: string): string | undefined {
  const value = detailReason?.trim();
  return value ? value : undefined;
}

export function reportProduct(
  productId: number,
  reasonCode: string,
  detailReason?: string
): Promise<void> {
  const detail = trimmed(detailReason);
  return postReport(
    `/reports/products/${productId}`,
    { reasonCodes: [reasonCode], ...(detail ? { detailReason: detail } : {}) },
    '상품 신고'
  );
}

export function reportUser(
  userId: number,
  reasonCode: string,
  detailReason?: string
): Promise<void> {
  const detail = trimmed(detailReason);
  return postReport(
    `/reports/users/${userId}`,
    { reasonCode, ...(detail ? { detailReason: detail } : {}) },
    '사용자 신고'
  );
}

export async function blockUser(userId: number): Promise<void> {
  const res = await apiFetch(`/reports/blocks/users/${userId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`사용자 차단에 실패했어요 (HTTP ${res.status})`);
}

export async function unblockUser(userId: number): Promise<void> {
  const res = await apiFetch(`/reports/blocks/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`차단 해제에 실패했어요 (HTTP ${res.status})`);
}

export interface BlockedUser {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

interface BlockedPage {
  content: BlockedUser[];
  hasNext: boolean;
}

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

export async function fetchBlockedUsers(page: number): Promise<BlockedPage> {
  const res = await apiFetch(`/reports/blocks/users?page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`차단 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: Partial<BlockedPage> };
  return {
    content: body.data?.content ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

/**
 * 「이미 신고했다」인지 가려낸다.
 *
 * 웹도 문구로 가려낸다(ProductReportModal · UserReportModal). 서버가 따로 코드를
 * 주지 않아서다. 상품은 "이미 신고한 상품입니다", 사용자는 "이미 신고한 사용자입니다".
 */
export function isAlreadyReported(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('이미 신고한');
}
```

- [ ] **Step 4: 테스트가 통과하는지 본다**

```bash
cd mobile && npx jest lib/reports.test.ts
```

기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/reports.ts mobile/lib/reports.test.ts
git commit -m "feat(mobile): 신고·차단 API (#805)"
```

---

# Task 3: 앱 프로필 조회

**Files:**
- Create: `mobile/lib/user-profile.ts`
- Test: `mobile/lib/user-profile.test.ts`

**Interfaces:**
- Consumes: `apiFetch`, `MyListPage` from `mobile/lib/my-lists.ts`
- Produces:
  - `interface UserProfile { id: number; nickname: string; profileImageUrl: string | null; addressSido: string | null; addressGugun: string | null; introduction: string | null; isBlocked: boolean; isReported: boolean }`
  - `fetchUserProfile(userId: number): Promise<UserProfile>`
  - `type ProductKind = 'sell' | 'request'`
  - `fetchUserProducts(userId: number, kind: ProductKind, page: number): Promise<MyListPage>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`mobile/lib/user-profile.test.ts`

```ts
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchUserProducts, fetchUserProfile } from './user-profile';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const emptyPage = { data: { page: 0, size: 20, content: [], hasNext: false } };

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200, emptyPage));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('fetchUserProfile', () => {
  it('/profile/{id} 를 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { id: 7, nickname: '지니' } }));

    await fetchUserProfile(7);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/profile/7');
  });

  it('isBlocked·isReported가 없으면 false로 본다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { id: 7, nickname: '지니' } }));

    const profile = await fetchUserProfile(7);

    expect(profile.isBlocked).toBe(false);
    expect(profile.isReported).toBe(false);
  });

  it('서버가 준 값을 그대로 쓴다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        data: {
          id: 7,
          nickname: '지니',
          introduction: '반갑습니다',
          isBlocked: true,
          isReported: true,
        },
      })
    );

    const profile = await fetchUserProfile(7);

    expect(profile.introduction).toBe('반갑습니다');
    expect(profile.isBlocked).toBe(true);
    expect(profile.isReported).toBe(true);
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUserProfile(7)).rejects.toThrow();
  });
});

describe('fetchUserProducts', () => {
  it('판매상품은 /products 를 부른다', async () => {
    await fetchUserProducts(7, 'sell', 0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/7/products?page=0&size=20'
    );
  });

  it('판매요청은 /purchase-requests 를 부른다 — 주소가 아예 다르다', async () => {
    await fetchUserProducts(7, 'request', 2);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/7/purchase-requests?page=2&size=20'
    );
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUserProducts(7, 'sell', 0)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 본다**

```bash
cd mobile && npx jest lib/user-profile.test.ts
```

기대: `Cannot find module './user-profile'`로 실패.

- [ ] **Step 3: 구현한다**

`mobile/lib/user-profile.ts`

```ts
import type { ProductResponse } from '@cuddle/shared';

import { apiFetch } from './auth/api';
import type { MyListPage } from './my-lists';

// 남의 프로필 화면이 쓰는 조회 셋.
//
// 셋 다 로그인해야 볼 수 있다 — 서버에 @PreAuthorize("isAuthenticated()")가 걸려 있어
// 게스트가 부르면 401이 온다. 그래서 화면이 게스트를 미리 걸러야 한다(Task 8).

/**
 * 서버는 이보다 많은 필드를 주지만 화면이 쓰는 것만 적는다.
 * (내 프로필은 lib/profile.ts의 MyProfile이 따로 있다 — 쓰는 필드가 다르다.)
 */
export interface UserProfile {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  addressSido: string | null;
  addressGugun: string | null;
  /** 소개글. 없으면 화면이 그 줄을 아예 안 그린다 */
  introduction: string | null;
  /** 내가 이 사람을 이미 차단했는지 */
  isBlocked: boolean;
  /** 내가 이 사람을 이미 신고했는지 */
  isReported: boolean;
}

export async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiFetch(`/profile/${userId}`);
  if (!res.ok) throw new Error(`프로필을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data: Partial<UserProfile> & { id: number } };
  const data = body.data;

  return {
    id: data.id,
    nickname: data.nickname ?? '',
    profileImageUrl: data.profileImageUrl ?? null,
    addressSido: data.addressSido ?? null,
    addressGugun: data.addressGugun ?? null,
    introduction: data.introduction ?? null,
    // 서버가 안 주면 "아직 아니다"로 본다 — 화면이 「차단 해제」를 잘못 그리는 것보다 낫다.
    isBlocked: data.isBlocked ?? false,
    isReported: data.isReported ?? false,
  };
}

/**
 * 상품 종류. 서버가 주소를 아예 나눠 놨다.
 *   sell     GET /profile/{id}/products            판매 상품(SELL)만
 *   request  GET /profile/{id}/purchase-requests    판매 요청(REQUEST)만
 * 「전체」 주소는 없다 — 그래서 화면 탭도 둘뿐이다(설계 §5).
 */
export type ProductKind = 'sell' | 'request';

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

export async function fetchUserProducts(
  userId: number,
  kind: ProductKind,
  page: number
): Promise<MyListPage> {
  const path = kind === 'sell' ? 'products' : 'purchase-requests';
  const label = kind === 'sell' ? '판매 상품' : '판매 요청';

  const res = await apiFetch(`/profile/${userId}/${path}?page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`${label}을 불러오지 못했어요 (HTTP ${res.status})`);

  const body: ProductResponse = await res.json();
  return body.data;
}
```

- [ ] **Step 4: 테스트가 통과하는지 본다**

```bash
cd mobile && npx jest lib/user-profile.test.ts
```

기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/user-profile.ts mobile/lib/user-profile.test.ts
git commit -m "feat(mobile): 남의 프로필 조회 (#805)"
```

---

# Task 4: 신고 화면

**Files:**
- Create: `mobile/app/report.tsx`
- Modify: `mobile/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 1의 `PRODUCT_REPORT_REASON`·`USER_REPORT_REASON`, Task 2의 `reportProduct`·`reportUser`·`isAlreadyReported`
- Produces: 경로 `/report?kind=product|user&id={n}&name={string}`

- [ ] **Step 1: 화면을 만든다**

`mobile/app/report.tsx`

```tsx
import { PRODUCT_REPORT_REASON, USER_REPORT_REASON } from '@cuddle/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isAlreadyReported, reportProduct, reportUser } from '@/lib/reports';

// 신고 화면. 상품용과 사용자용을 한 화면이 다 그린다 —
// 사유 목록과 보낼 주소만 다르고 나머지가 같아서, 화면을 나누면 같은 코드가 두 벌이 된다.
//
// 왜 모달이 아니라 전체 화면인가:
// 앱의 다른 「집중해서 끝내는 화면」(로그인 · 회원가입 · 알림)이 다 전체 화면이고,
// 좁은 폭에서 모달에 라디오 8개 + 글상자를 넣으면 세로로 눌린다.
// 그래서 루트 스택에 둔다 — 탭바까지 덮어야 한다.

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값
const DETAIL_MAX = 300; // 웹 ReportApiErrors.detailReason.maxLength와 같은 값

export default function ReportScreen() {
  const router = useRouter();
  const { kind, id, name } = useLocalSearchParams<{
    kind: 'product' | 'user';
    id: string;
    name?: string;
  }>();

  const isProduct = kind === 'product';
  const targetId = Number(id);
  const reasons = isProduct ? PRODUCT_REPORT_REASON : USER_REPORT_REASON;

  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reasonCode || submitting) return;
    setSubmitting(true);

    try {
      if (isProduct) {
        await reportProduct(targetId, reasonCode, detail);
      } else {
        await reportUser(targetId, reasonCode, detail);
      }
      // 화면이 통째로 바뀌므로 "됐다"는 신호가 없으면 눌렀는지 모른다.
      // 웹은 모달만 닫고 아무 말이 없지만, 여기는 매체가 달라 일부러 다르게 간다.
      Alert.alert('신고가 접수되었습니다', undefined, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      const already = isAlreadyReported(error);
      Alert.alert(
        already
          ? isProduct
            ? '이미 신고한 상품입니다.'
            : '이미 신고한 사용자입니다.'
          : '신고에 실패했습니다.',
        already ? undefined : '잠시 후 다시 시도해주세요.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <X size={24} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>{isProduct ? '상품 신고하기' : '사용자 신고하기'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {name ? (
          <Text style={styles.description}>
            {isProduct ? `"${name}" 상품을 신고합니다.` : `${name}님을 신고합니다.`}
          </Text>
        ) : null}

        <Text style={styles.label}>
          신고 사유 <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.reasonBox}>
          {reasons.map((reason, index) => (
            <Pressable
              key={reason.id}
              onPress={() => setReasonCode(reason.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reasonCode === reason.id }}
              style={({ pressed }) => [
                styles.reasonRow,
                index > 0 && styles.reasonDivider,
                pressed && styles.pressedRow,
              ]}
            >
              <Text style={styles.reasonLabel}>{reason.label}</Text>
              {reasonCode === reason.id ? <Check size={20} color="#111827" /> : null}
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>신고 상세 사유 (선택)</Text>
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="신고 상세 사유를 입력해주세요."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={DETAIL_MAX}
          style={styles.detailInput}
        />
        <Text style={styles.counter}>
          {detail.length}/{DETAIL_MAX}자
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={!reasonCode || submitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submit,
            (!reasonCode || submitting) && styles.submitDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitLabel}>신고하기</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  pressed: { opacity: 0.5 },
  pressedRow: { backgroundColor: '#F9FAFB' },
  body: { padding: 16, gap: 8, paddingBottom: 24 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 8 },
  required: { color: '#DC2626' },
  reasonBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  reasonDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  reasonLabel: { fontSize: 15, color: '#111827' },
  detailInput: {
    minHeight: 110,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  counter: { fontSize: 12, color: '#9CA3AF', alignSelf: 'flex-end' },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  submit: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
```

- [ ] **Step 2: 화면을 등록한다**

`mobile/app/_layout.tsx`

```diff
           <Stack.Screen name="notifications" options={{ headerShown: false }} />
+          {/* 헤더는 화면이 직접 그린다(login과 같은 이유). */}
+          <Stack.Screen name="report" options={{ headerShown: false }} />
         </Stack>
```

- [ ] **Step 3: 타입·린트를 확인한다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

기대: 오류 0건.

- [ ] **Step 4: 커밋**

```bash
git add mobile/app/report.tsx mobile/app/_layout.tsx
git commit -m "feat(mobile): 신고 화면 (#805)"
```

---

# Task 5: 차단 확인 창

**Files:**
- Create: `mobile/components/report/block-confirm.tsx`

**Interfaces:**
- Consumes: Task 1의 `USER_BLOCK_ALERT_LIST`, Task 2의 `blockUser`
- Produces: `<BlockConfirm visible={boolean} nickname={string} userId={number} onClose={() => void} onDone={() => void} />`

- [ ] **Step 1: 조각을 만든다**

`mobile/components/report/block-confirm.tsx`

```tsx
import { USER_BLOCK_ALERT_LIST } from '@cuddle/shared';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { blockUser } from '@/lib/reports';

// 차단 확인 창.
//
// 로그아웃 확인 창(components/my/logout-modal.tsx)과 같은 결로 만든다 —
// 같은 앱에서 확인 창 모양이 갈리면 만든 사람이 다른 화면처럼 보인다.
// 다만 안내 줄이 있어 글자는 왼쪽 정렬이다(로그아웃은 한 줄뿐이라 가운데).
//
// 색은 앱이 지금 쓰는 무채색 그대로다. 웹 브랜드 토큰 매핑은 #786에서 다룬다.

interface Props {
  visible: boolean;
  nickname: string;
  userId: number;
  onClose: () => void;
  /** 차단이 끝났을 때. 보통 프로필을 다시 불러온다. */
  onDone: () => void;
}

export function BlockConfirm({ visible, nickname, userId, onClose, onDone }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await blockUser(userId);
      onDone();
    } catch {
      setError('사용자 차단에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>사용자 차단하기</Text>
          <Text style={styles.description}>{`정말로 ${nickname}님을 차단하시겠습니까?`}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* 문구는 @cuddle/shared가 원본이다 — 웹도 같은 것을 쓴다. */}
          <View style={styles.alertBox}>
            {USER_BLOCK_ALERT_LIST.map((line) => (
              <Text key={line} style={styles.alertLine}>
                {`· ${line}`}
              </Text>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirm,
                submitting && styles.confirmDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLabel}>차단하기</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    // 8은 로그아웃 확인 창과 같은 값이다.
    borderRadius: 8,
    padding: 20,
    gap: 10,
  },
  heading: { fontSize: 19, fontWeight: '700', color: '#111827' },
  description: { fontSize: 14, color: '#6B7280' },
  error: { fontSize: 13, color: '#DC2626' },
  alertBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  alertLine: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: { opacity: 0.5 },
  confirmLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
```

> 확인 버튼만 빨강(`#DC2626`)이다. 웹 `BlockModal`도 `bg-danger-600`을 쓴다 — 되돌리기 어려운 동작이라 로그아웃(검정)과 구분한다.

- [ ] **Step 2: 타입·린트를 확인한다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

- [ ] **Step 3: 커밋**

```bash
git add mobile/components/report/block-confirm.tsx
git commit -m "feat(mobile): 차단 확인 창 (#805)"
```

---

# Task 6: 상품 상세에 `⋮` 붙이기

**Files:**
- Modify: `mobile/components/product-detail/detail-header.tsx`
- Modify: `mobile/app/(tabs)/(home)/products/[id].tsx`

**Interfaces:**
- Consumes: Task 5의 `BlockConfirm`, 기존 `ProductActionSheet`·`useMe`
- Produces: `<DetailHeader onMorePress?={() => void} />`

- [ ] **Step 1: 헤더가 `⋮`를 받게 한다**

`mobile/components/product-detail/detail-header.tsx`

import과 props를 바꾼다.

```diff
-import { ChevronLeft } from 'lucide-react-native';
+import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';
```

```diff
-export function DetailHeader() {
+interface Props {
+  /**
+   * 넘기면 오른쪽에 ⋮ 가 붙는다. 안 넘기면 안 그린다 —
+   * 내 상품일 때는 신고·차단이 의미가 없어서 부르는 쪽이 뺀다(#805).
+   */
+  onMorePress?: () => void;
+}
+
+export function DetailHeader({ onMorePress }: Props) {
   const router = useRouter();
```

`</View>` 앞에 `⋮`를 더한다. 뒤로가기 `Pressable` 바로 다음이다.

```diff
         <ChevronLeft size={26} color="#111827" />
       </Pressable>
+
+      {onMorePress ? (
+        <Pressable
+          onPress={onMorePress}
+          hitSlop={12}
+          accessibilityRole="button"
+          accessibilityLabel="더보기"
+          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
+        >
+          <EllipsisVertical size={24} color="#111827" />
+        </Pressable>
+      ) : null}
     </View>
```

`header` 스타일에 한 줄을 더해 `⋮`가 오른쪽 끝으로 가게 한다.

```diff
   header: {
     height: HEADER_HEIGHT,
     flexDirection: 'row',
+    justifyContent: 'space-between',
```

- [ ] **Step 2: 상세 화면이 시트를 열게 한다**

`mobile/app/(tabs)/(home)/products/[id].tsx`

import을 더한다.

```tsx
import { useState } from 'react';

import { ProductActionSheet } from '@/components/my/product-action-sheet';
import { BlockConfirm } from '@/components/report/block-confirm';
import { useMe } from '@/hooks/use-me';
```

`ProductDetailScreen` 안, `return` 위에 상태와 값을 더한다.

```tsx
  const { data: me } = useMe();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  const seller = product?.sellerInfo;
  // 내 상품에는 ⋮ 를 아예 안 그린다. 내 것을 신고·차단할 이유가 없다.
  // (수정·삭제는 11바퀴 몫이라 이번엔 메뉴 자체가 없다.)
  const isMine = Boolean(me && seller && me.id === seller.sellerId);
  const canReport = Boolean(seller && seller.sellerId > 0 && !isMine);
```

> `sellerId > 0`을 보는 이유: 상세 응답이 오기 전 목록 값으로 화면을 채울 때 `sellerId: 0`인 자리표시자가 쓰인다(같은 파일 위쪽 주석). 그때 `⋮`를 그리면 0번 사용자를 신고하게 된다.

`<DetailHeader />`를 바꾼다.

```diff
-      <DetailHeader />
+      <DetailHeader onMorePress={canReport ? () => setIsSheetOpen(true) : undefined} />
```

`SafeAreaView`가 닫히기 직전에 시트와 확인 창을 더한다.

```tsx
      {seller ? (
        <>
          <ProductActionSheet
            visible={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            actions={[
              {
                label: '상품 신고하기',
                onPress: () => {
                  setIsSheetOpen(false);
                  router.push({
                    pathname: '/report',
                    params: { kind: 'product', id: String(productId), name: product.title },
                  });
                },
              },
              {
                label: '판매자 차단하기',
                tone: 'danger',
                onPress: () => {
                  setIsSheetOpen(false);
                  setIsBlockOpen(true);
                },
              },
            ]}
          />
          <BlockConfirm
            visible={isBlockOpen}
            nickname={seller.sellerNickname}
            userId={seller.sellerId}
            onClose={() => setIsBlockOpen(false)}
            onDone={() => {
              setIsBlockOpen(false);
              Alert.alert('차단했습니다');
            }}
          />
        </>
      ) : null}
```

`Alert`를 `react-native` import에 더한다. `productId`·`product`·`router`는 이 파일에 이미 있는 값이다 — 이름이 다르면 그 파일의 이름을 쓴다.

> **⋮ 에 「차단 해제」를 안 그리는 이유**: 상품 상세 응답에 `isBlocked`가 없다(설계 §10-②). 이미 차단한 사람이면 서버가 막고 그 메시지가 뜬다.

- [ ] **Step 3: 타입·린트를 확인한다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

- [ ] **Step 4: 커밋**

```bash
git add mobile/components/product-detail/detail-header.tsx "mobile/app/(tabs)/(home)/products/[id].tsx"
git commit -m "feat(mobile): 상품 상세에 신고·차단 메뉴 (#805)"
```

---

# Task 7: 판매자 프로필 화면

**Files:**
- Create: `mobile/components/user-profile/profile-head.tsx`
- Create: `mobile/components/user-profile/kind-tabs.tsx`
- Create: `mobile/app/(tabs)/(home)/users/[id].tsx`
- Create: `mobile/app/(tabs)/(my)/users/[id].tsx`

**Interfaces:**
- Consumes: Task 2·3 전부, Task 5의 `BlockConfirm`, 기존 `ProductCard`·`list-states`·`ProductActionSheet`
- Produces: 경로 `/(tabs)/(home)/users/{id}` · `/(tabs)/(my)/users/{id}`

- [ ] **Step 1: 프로필 머리 조각을 만든다**

`mobile/components/user-profile/profile-head.tsx`

```tsx
import { Image } from 'expo-image';
import { ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { UserProfile } from '@/lib/user-profile';

// 프로필 위쪽 — 사진 · 닉네임 · 지역 · 소개글.
// 웹 ProfileData(모바일 폭)와 같은 구성이다.

interface Props {
  profile: UserProfile;
}

export function ProfileHead({ profile }: Props) {
  const [failed, setFailed] = useState(false);
  const location = [profile.addressSido, profile.addressGugun].filter(Boolean).join(' ');
  const showImage = Boolean(profile.profileImageUrl) && !failed;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {showImage ? (
            <Image
              source={{ uri: profile.profileImageUrl as string }}
              style={styles.avatarImage}
              contentFit="cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <Text style={styles.avatarInitial}>
              {profile.nickname.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            {/* 웹 ProfileData와 같은 배지 */}
            {profile.isBlocked ? (
              <View style={styles.blockedBadge}>
                <ShieldAlert size={12} color="#DC2626" />
                <Text style={styles.blockedLabel}>차단 유저</Text>
              </View>
            ) : null}
          </View>
          {location ? <Text style={styles.location}>{location}</Text> : null}
        </View>
      </View>

      {/* 소개글이 없으면 줄을 아예 안 그린다.
          웹은 남의 프로필에서도 「소개글을 작성해주세요」가 뜨는데(#810), 남에게
          작성하라고 할 이유가 없다. 앱은 처음부터 안 그런다. */}
      {profile.introduction ? (
        <Text style={styles.introduction}>{profile.introduction}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // 판매자 카드와 같은 크림색. 회색은 에러처럼 보인다는 피드백이 있었다.
    backgroundColor: '#FAF3E6',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 22, color: '#111827' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 18, fontWeight: '700', color: '#111827' },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    // 웹 bg-red-100 / text-red-600과 같은 결
    backgroundColor: '#FEE2E2',
  },
  blockedLabel: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  location: { fontSize: 13, color: '#6B7280' },
  introduction: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});
```

- [ ] **Step 2: 탭 조각을 만든다**

`mobile/components/user-profile/kind-tabs.tsx`

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductKind } from '@/lib/user-profile';

// 프로필의 [판매상품][판매요청] 탭. 웹 USER_PAGE_TABS와 같은 둘이다.
//
// 왜 마이의 StatusFilterChips를 못 쓰나:
// 그건 「거래 상태」(판매중·예약중·판매완료)를 한 목록 안에서 거르는 칩이고,
// 이건 「상품 종류」라 목록 자체가 다르다(주소가 아예 나뉘어 있다).
// 축이 달라서 같은 조각으로 묶으면 둘 다 헷갈린다.
//
// 밑줄형인 이유: 웹도 UnderlineTabs를 쓴다.

const TABS: { id: ProductKind; label: string }[] = [
  { id: 'sell', label: '판매상품' },
  { id: 'request', label: '판매요청' },
];

interface Props {
  activeId: ProductKind;
  onChange: (id: ProductKind) => void;
}

export function KindTabs({ activeId, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#111827' },
  pressed: { opacity: 0.6 },
  label: { fontSize: 15, color: '#9CA3AF' },
  labelActive: { color: '#111827', fontWeight: '700' },
});
```

- [ ] **Step 3: 화면을 만든다**

`mobile/app/(tabs)/(home)/users/[id].tsx`

```tsx
import type { Product } from '@cuddle/shared';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { ProductActionSheet } from '@/components/my/product-action-sheet';
import { ProductCard } from '@/components/product-card';
import { BlockConfirm } from '@/components/report/block-confirm';
import { KindTabs } from '@/components/user-profile/kind-tabs';
import { ProfileHead } from '@/components/user-profile/profile-head';
import { useMe } from '@/hooks/use-me';
import { unblockUser } from '@/lib/reports';
import { fetchUserProducts, fetchUserProfile, type ProductKind } from '@/lib/user-profile';

// 판매자 프로필. 상품 상세의 판매자 카드를 눌러 들어온다.
//
// 왜 MyProductList를 안 쓰나:
// 그 안의 RowShell이 이동 경로를 /(tabs)/(my)/products/... 로 못 박고 있어서,
// 홈 스택에서 쓰면 상품을 누를 때 마이 탭으로 튄다. 게다가 헤더 제목 · 등록 버튼 ·
// 상태 필터 칩 · 관리 시트를 다 안고 있어 여기 필요 없는 게 많다.
// 목록을 여기서 직접 그리는 게 짧고 정확하다.

const HEADER_HEIGHT = 52;

export default function UserProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const { data: me } = useMe();
  const [kind, setKind] = useState<ProductKind>('sell');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
  });

  const {
    data: pages,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['userProducts', userId, kind],
    queryFn: ({ pageParam }) => fetchUserProducts(userId, kind, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const products: Product[] = pages?.pages.flatMap((page) => page.content) ?? [];
  const isMine = Boolean(me && profile && me.id === profile.id);

  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
  };

  const handleUnblock = async () => {
    try {
      await unblockUser(userId);
      refreshProfile();
      Alert.alert('차단을 해제했습니다');
    } catch {
      Alert.alert('차단 해제에 실패했습니다.', '잠시 후 다시 시도해주세요.');
    }
  };

  /** ⋮ 에 담을 항목. isBlocked·isReported가 있어 상태를 정확히 그린다(설계 §8). */
  const sheetActions = profile
    ? [
        profile.isBlocked
          ? { label: '차단 해제', onPress: () => {
              setIsSheetOpen(false);
              handleUnblock();
            } }
          : { label: '차단하기', tone: 'danger' as const, onPress: () => {
              setIsSheetOpen(false);
              setIsBlockOpen(true);
            } },
        profile.isReported
          ? { label: '신고완료', onPress: () => setIsSheetOpen(false) }
          : { label: '신고하기', onPress: () => {
              setIsSheetOpen(false);
              router.push({
                pathname: '/report',
                params: { kind: 'user', id: String(userId), name: profile.nickname },
              });
            } },
      ]
    : [];

  const renderBody = () => {
    if (profileLoading) return <LoadingState />;
    if (profileError || !profile) {
      return <ErrorState onRetry={() => refetchProfile()} title="프로필을 불러오지 못했어요." />;
    }

    return (
      <>
        <ProfileHead profile={profile} />
        <KindTabs activeId={kind} onChange={setKind} />
        {renderList()}
      </>
    );
  };

  const renderList = () => {
    if (listLoading) return <LoadingState />;
    if (listError) {
      return <ErrorState onRetry={() => refetchList()} title="상품을 불러오지 못했어요." />;
    }
    if (products.length === 0) {
      return (
        <EmptyState
          title={kind === 'sell' ? '등록한 판매 상품이 없어요.' : '등록한 판매 요청이 없어요.'}
          description="다른 탭도 살펴보세요."
        />
      );
    }

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            // 지금 스택에 상세를 쌓는다. 그룹까지 적어야 다른 탭으로 안 튄다.
            onPress={() => router.push(`/(tabs)/(home)/products/${item.id}`)}
            style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
          >
            <ProductCard product={item} />
          </Pressable>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>

        {/* 내 프로필에는 ⋮ 를 안 그린다 — 나를 신고·차단할 이유가 없다. */}
        {profile && !isMine ? (
          <Pressable
            onPress={() => setIsSheetOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="더보기"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <EllipsisVertical size={24} color="#111827" />
          </Pressable>
        ) : null}
      </View>

      {renderBody()}

      <ProductActionSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        actions={sheetActions}
      />
      {profile ? (
        <BlockConfirm
          visible={isBlockOpen}
          nickname={profile.nickname}
          userId={userId}
          onClose={() => setIsBlockOpen(false)}
          onDone={() => {
            setIsBlockOpen(false);
            refreshProfile();
            Alert.alert('차단했습니다');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pressed: { opacity: 0.5 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  cardPressed: { opacity: 0.7 },
});
```

> `Text`를 import했지만 안 쓰면 lint가 잡는다. 그때는 import에서 뺀다.

- [ ] **Step 4: 마이 스택에도 같은 화면을 둔다**

`mobile/app/(tabs)/(my)/users/[id].tsx`

```tsx
import UserProfileScreen from '@/app/(tabs)/(home)/users/[id]';

// 마이 스택에서 여는 판매자 프로필.
//
// 화면은 홈 것과 똑같다. 파일을 하나 더 두는 이유는 **어느 스택에 쌓이느냐**가 다르기
// 때문이다 — products/[id]와 같은 이유다. 프로필이 홈 스택에만 있으면, 찜 목록에서
// 상품 상세로 들어가 판매자를 눌렀을 때 홈 탭으로 옮겨간 뒤 거기에 쌓인다.
// 그래서 뒤로 가면 원래 자리가 아니라 홈이 나온다.
export default UserProfileScreen;
```

> ⚠️ 본체의 목록 이동 경로가 `/(tabs)/(home)/products/...`로 고정돼 있다. 마이 스택에서 열면 상품을 누를 때 홈 탭으로 넘어간다. **Task 8에서 실기기로 확인하고, 어색하면 `useSegments()`로 지금 그룹을 읽어 경로를 만든다.**

- [ ] **Step 5: 타입·린트를 확인한다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

기대: 오류 0건. `ProductCard`의 props 이름이 다르면 그 파일을 열어 맞춘다.

- [ ] **Step 6: 커밋**

```bash
git add mobile/components/user-profile/ "mobile/app/(tabs)/(home)/users/[id].tsx" "mobile/app/(tabs)/(my)/users/[id].tsx"
git commit -m "feat(mobile): 판매자 프로필 화면 (#805)"
```

---

# Task 8: 판매자 카드를 눌러 프로필로

**Files:**
- Modify: `mobile/components/product-detail/seller-card.tsx`

**Interfaces:**
- Consumes: Task 7의 경로

- [ ] **Step 1: 카드를 누를 수 있게 한다**

`mobile/components/product-detail/seller-card.tsx`

import을 바꾼다.

```diff
 import type { SellerInfo } from '@cuddle/shared';
 import { Image } from 'expo-image';
+import { useRouter } from 'expo-router';
 import { useState } from 'react';
-import { StyleSheet, Text, View } from 'react-native';
+import { Pressable, StyleSheet, Text, View } from 'react-native';
+
+import { useAuthStore } from '@/lib/auth/store';
```

주석을 고친다 — 지금은 사실이 아니다.

```diff
-// 프로필로 이동하는 동작은 로그인이 있어야 해서 이번 바퀴에는 없다.
+// 누르면 판매자 프로필로 간다(#805).
+//
+// 게스트면 프로필 대신 로그인 화면을 띄운다. 서버에 @PreAuthorize가 걸려 있어
+// 게스트가 열면 401만 받고 빈 화면을 보게 된다. 마이 탭이 쓰는 방식과 같다 —
+// 「들어간 뒤 밀어내기」가 아니라 「들어가기 전에 막기」라야 취소했을 때 제자리로 돌아온다.
```

`SellerCard` 안에서 바깥 `View`를 `Pressable`로 바꾼다.

```diff
 export function SellerCard({ seller }: Props) {
   const [failed, setFailed] = useState(false);
+  const router = useRouter();
+  const isAuthed = useAuthStore((state) => state.status) === 'authed';
   const location = [seller.addressSido, seller.addressGugun].filter(Boolean).join(' ');
   const showImage = Boolean(seller.sellerProfileImageUrl) && !failed;
 
+  const open = () => {
+    if (!isAuthed) {
+      router.push('/login');
+      return;
+    }
+    router.push(`/(tabs)/(home)/users/${seller.sellerId}`);
+  };
+
   return (
-    <View style={styles.row}>
+    <Pressable
+      onPress={open}
+      accessibilityRole="button"
+      accessibilityLabel={`${seller.sellerNickname} 프로필 보기`}
+      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
+    >
```

닫는 태그도 바꾼다.

```diff
       </View>
-    </View>
+    </Pressable>
   );
```

스타일을 더한다.

```diff
   row: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 10,
   },
+  rowPressed: {
+    opacity: 0.6,
+  },
```

- [ ] **Step 2: 타입·린트를 확인한다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

- [ ] **Step 3: 실기기로 확인한다**

```bash
cd mobile && pnpm expo start
```

```
□ 상품 상세에서 판매자 카드를 누르면 프로필이 열린다
□ 프로필에서 뒤로 가면 상품 상세로 돌아온다
□ 로그아웃 상태로 누르면 로그인 화면이 뜬다
□ 찜 목록 → 상품 상세 → 판매자 → 뒤로 가기를 했을 때 찜 목록으로 돌아온다
   (여기서 홈으로 튀면 Task 7 Step 4의 경고대로 useSegments()로 고친다)
□ 프로필의 상품을 누르면 그 상품 상세가 열리고, 뒤로 가면 프로필로 돌아온다
```

- [ ] **Step 4: 커밋**

```bash
git add mobile/components/product-detail/seller-card.tsx
git commit -m "feat(mobile): 판매자 카드를 눌러 프로필로 (#805)"
```

---

# Task 9: 마이 ▸ 차단 목록

**Files:**
- Create: `mobile/app/(tabs)/(my)/blocked-users.tsx`
- Modify: `mobile/app/(tabs)/(my)/index.tsx`

**Interfaces:**
- Consumes: Task 2의 `fetchBlockedUsers`·`unblockUser`

- [ ] **Step 1: 화면을 만든다**

`mobile/app/(tabs)/(my)/blocked-users.tsx`

```tsx
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { fetchBlockedUsers, unblockUser, type BlockedUser } from '@/lib/reports';

// 차단한 사람 목록. 여기서 해제한다.
//
// 이 화면이 있어야 차단 안내 문구가 참이 된다 —
// 「차단은 언제든 차단 목록에서 해제할 수 있습니다」(@cuddle/shared).

const HEADER_HEIGHT = 52;

export default function BlockedUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['blockedUsers'],
      queryFn: ({ pageParam }) => fetchBlockedUsers(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
    });

  const users: BlockedUser[] = data?.pages.flatMap((page) => page.content) ?? [];

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert('차단 해제', `${user.nickname}님의 차단을 해제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        onPress: async () => {
          try {
            await unblockUser(user.userId);
            queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
            // 그 사람 프로필을 열어 뒀다면 거기 배지도 사라져야 한다.
            queryClient.invalidateQueries({ queryKey: ['userProfile', user.userId] });
          } catch {
            Alert.alert('차단 해제에 실패했습니다.', '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="차단 목록을 불러오지 못했어요." />;
    if (users.length === 0) {
      return (
        <EmptyState
          title="차단한 사용자가 없어요."
          description="차단하면 여기에서 확인하고 해제할 수 있어요."
        />
      );
    }

    return (
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.userId)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              {item.profileImageUrl ? (
                <Image
                  source={{ uri: item.profileImageUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {item.nickname.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.nickname}>{item.nickname}</Text>
            <Pressable
              onPress={() => handleUnblock(item)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.unblock, pressed && styles.pressed]}
            >
              <Text style={styles.unblockLabel}>차단 해제</Text>
            </Pressable>
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>차단 목록</Text>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  pressed: { opacity: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF3E6',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 16, color: '#111827' },
  nickname: { flex: 1, fontSize: 15, color: '#111827' },
  unblock: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
  },
  unblockLabel: { fontSize: 13, fontWeight: '600', color: '#111827' },
});
```

- [ ] **Step 2: 마이 탭에 줄을 더한다**

`mobile/app/(tabs)/(my)/index.tsx`

import에 아이콘을 더한다.

```diff
-import { Handbag, Headphones, Heart, LogOut, Tag, UserMinus } from 'lucide-react-native';
+import { Handbag, Headphones, Heart, LogOut, Tag, UserMinus, UserX } from 'lucide-react-native';
```

「계정」 카드의 로그아웃 위에 넣는다 — 차단은 내 계정 설정에 가깝다.

```diff
         <SectionCard title="계정">
+          <SectionRow
+            icon={UserX}
+            label="차단 목록"
+            onPress={() => router.push('/(tabs)/(my)/blocked-users')}
+          />
           <SectionRow icon={LogOut} label="로그아웃" onPress={() => setIsLogoutOpen(true)} />
```

> `UserX`는 웹 `myPageIconMap`의 `BLOCKED: UserRoundX`와 뜻이 같다. 웹은 `UserRoundX`인데 앱의 다른 아이콘들이 각진 계열이라 `UserX`로 맞춘다.

- [ ] **Step 3: 게이트를 돌린다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

- [ ] **Step 4: 커밋**

```bash
git add "mobile/app/(tabs)/(my)/blocked-users.tsx" "mobile/app/(tabs)/(my)/index.tsx"
git commit -m "feat(mobile): 마이 차단 목록 (#805)"
```

---

# Task 10: 실기기 확인 (사용자)

**Files:** 없음

- [ ] **Step 1: Expo Go로 띄운다**

```bash
cd mobile && pnpm expo start
```

- [ ] **Step 2: 확인한다**

```
프로필
□ 판매자 카드를 누르면 프로필로 간다 · 게스트면 로그인 화면이 뜬다
□ 사진 · 닉네임 · 지역 · 소개글이 보인다
□ 소개글이 없는 사람은 그 줄이 아예 안 보인다 (「작성해주세요」가 안 뜬다)
□ 탭을 바꾸면 판매상품/판매요청이 각각 나오고 무한스크롤이 이어진다
□ 내 프로필로 들어가면 ⋮ 가 없다

신고
□ 프로필 ⋮ → 신고하기 → 사유를 고르면 제출 버튼이 켜진다
□ 사유를 안 고르면 제출 버튼이 안 눌린다
□ 상세 사유가 300자에서 더 안 써진다
□ 제출하면 「신고가 접수되었습니다」가 뜨고 원래 화면으로 돌아온다
□ 같은 것을 또 신고하면 「이미 신고한 …입니다」가 뜬다
□ 상품 상세 ⋮ → 상품 신고하기도 같은 화면이 열리고 사유가 8개다

차단
□ 프로필 ⋮ → 차단하기 → 안내 3줄이 보이고 확인하면 차단된다
□ 차단 후 닉네임 옆에 「차단 유저」 배지가 붙고 ⋮ 가 「차단 해제」로 바뀐다
□ 「차단 해제」를 누르면 배지가 사라진다
□ 상품 상세 ⋮ → 판매자 차단하기도 된다
□ 이미 신고한 사용자의 프로필 ⋮ 에는 「신고완료」가 보인다

차단 목록
□ 마이 ▸ 차단 목록에 차단한 사람이 보인다
□ 「차단 해제」를 누르면 확인 후 목록에서 사라진다
□ 아무도 차단 안 했을 때 빈 화면 문구가 보인다

이동
□ 찜 목록 → 상품 상세 → 판매자 → 뒤로 가기 → 찜 목록으로 돌아온다
   (홈으로 튀면 Task 7 Step 4의 경고대로 고친다)
```

- [ ] **Step 3: 결과를 보고한다**

안 되는 게 있으면 어느 항목인지와 화면 사진을 남긴다.

---

# Task 11: 마무리

- [ ] **Step 1: 전체 게이트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
cd .. && npx tsc --noEmit && pnpm build
git diff --name-only develop...HEAD -- 'src/**/*.ts' 'src/**/*.tsx' 'packages/**/*.ts' | tr '\n' '\0' | xargs -0 npx eslint
```

기대: 앱 오류 0건 · 테스트 전부 통과 / 웹 타입·빌드 성공.

> `pnpm lint`(전체)는 아직 exit 1이 정상이다 — #788의 잔여 건. 바뀐 파일만 본다.

- [ ] **Step 2: 스펙에 실기기 결과를 적는다**

`docs/superpowers/specs/2026-08-01-app-report-block-design.md`에 §10-1을 더해 실기기에서 드러난 것을 남긴다. 없으면 「확인 완료」만 적는다.

- [ ] **Step 3: PR**

`/commit-push`로 PR을 만든다. **base는 `develop`이다.** 본문에 `Close #805`를 넣는다.

> #808·#809·#810은 **닫지 않는다.** 이번 바퀴에서 고치는 것이 아니라 발견해서 뗀 것이다.

---

## 완료 기준 (스펙 §11)

```
□ 판매자 카드를 누르면 프로필로 간다 · 게스트면 로그인 화면이 뜬다
□ 프로필에 사진 · 닉네임 · 지역 · 소개글이 보인다
□ 탭을 바꾸면 판매상품/판매요청 목록이 각각 나오고 무한스크롤이 된다
□ 프로필 ⋮ → 신고하기 → 사유를 고르고 제출하면 접수된다
□ 프로필 ⋮ → 차단하기 → 확인 후 ⋮가 「차단 해제」로 바뀌고 「차단 유저」 배지가 붙는다
□ 이미 신고한 사용자의 프로필 ⋮에는 「신고완료」가 회색으로 안 눌리게 보인다
□ 소개글이 없는 사람의 프로필에는 소개글 줄이 아예 안 보인다
□ 상품 상세 ⋮ → 상품 신고하기 · 판매자 차단하기가 각각 된다
□ 이미 신고한 것을 또 신고하면 「이미 신고한 상품입니다」가 뜬다
□ 내 상품 · 내 프로필에는 ⋮가 없다
□ 마이 ▸ 차단 목록에서 차단한 사람이 보이고 해제된다
□ 차단 안내 문구가 웹 · 앱 모두 새 문구다
□ 앱 tsc · lint · jest / 웹 tsc · eslint
```
