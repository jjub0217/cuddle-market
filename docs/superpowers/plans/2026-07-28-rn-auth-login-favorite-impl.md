# 앱 로그인 + 찜 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에 인증 배관(토큰 저장 · API 클라이언트 · 401 갱신)을 놓고, 그 위에서 로그인 · 마이 탭 · 찜 토글 · 로그아웃 · 탈퇴가 실제로 돌게 한다. 웹은 모바일 폭 로그인 문구를 지우고 마이페이지에 「계정」 카드를 추가한다.

**Architecture:** 토큰 2개는 `expo-secure-store`에 **각각 별도 키**로 저장한다(값 하나당 ~2048바이트 제한 회피). 로그인 상태는 zustand 메모리 store가 들고, 리액트 밖(`apiFetch`)에서는 `getState()`로 읽는다. 내 프로필은 저장하지 않고 TanStack Query `['me']`로 매번 받는다. HTTP는 기존 `mobile/lib/products.ts`와 같은 결의 `fetch` 래퍼를 쓴다.

**Tech Stack:** Expo SDK 54 · expo-router 6 · React Native 0.81 · TanStack Query 5 · zustand 5 · expo-secure-store · jest-expo

**설계 문서:** `docs/superpowers/specs/2026-07-28-rn-auth-login-favorite-design.md`
**이슈:** #784 · **브랜치:** `feature/784--rn-auth-login-favorite`

## Global Constraints

- **Expo SDK는 54로 고정.** 사용자의 Expo Go가 54.0.8이라 상위 SDK는 실기기에서 안 뜬다. 패키지 설치는 반드시 `npx expo install <pkg>`(SDK에 맞는 버전을 골라줌). `@latest`나 `pnpm add`로 Expo 패키지를 넣지 말 것.
- **작업 디렉터리**: 앱 명령은 `mobile/`에서, 웹 명령은 저장소 루트에서 실행한다.
- **앱 코드 스타일**: 세미콜론 있음, 작은따옴표, `StyleSheet.create`, import 별칭 `@/`. 주석은 한국어로 **"왜"** 를 적는다(무엇을 하는지는 코드가 말한다). 기존 `mobile/lib/products.ts` · `mobile/components/product-detail/detail-header.tsx`가 본보기.
- **웹 코드 스타일**: 세미콜론 없음, 작은따옴표, Tailwind v4.
- **색상 리터럴**: 앱은 아직 색 토큰 체계가 없다. 기존 화면과 같은 회색조를 그대로 쓴다 — 글자 `#111827`, 보조 글자 `#6B7280`, 테두리 `#E5E7EB`, 배경 `#F9FAFB`, 흰색 `#FFFFFF`. 새 팔레트를 만들지 말 것.
- **헤더 높이 52** — 홈 · 상세 헤더와 같은 값. 화면 전환 시 위치가 흔들리지 않게 하려는 것이니 새 화면도 52를 쓴다.
- **문구 금지**: 앱 로그인 화면에 "우리 아이를 위한 믿음직한 선택"을 넣지 않는다.
- **범위 밖**: 소셜 로그인, 회원가입, 비밀번호 찾기, 찜한 상품 목록, 내 상품 목록, 신고, 채팅. 이 계획에서 만들지 않는다.
- **검증 명령** (베이스라인 확인 완료: 타입 오류 0, 테스트 12개 통과)
  - 앱 타입체크: `cd mobile && npx tsc --noEmit`
  - 앱 테스트: `cd mobile && npx jest`
  - 웹 타입체크: `npx tsc --noEmit` (저장소 루트)
  - 웹 린트: `pnpm lint`

---

## File Structure

**앱 — 새로 만드는 파일**

| 경로 | 책임 |
|---|---|
| `mobile/lib/auth/tokens.ts` | SecureStore 읽기 · 쓰기 · 삭제. **SecureStore를 아는 유일한 파일** |
| `mobile/lib/auth/tokens.test.ts` | 위 테스트 |
| `mobile/lib/auth/store.ts` | zustand. 메모리 토큰 + 상태(`restoring`/`authed`/`guest`) |
| `mobile/lib/auth/api.ts` | `apiFetch()` — Bearer 부착, 401 → 갱신 → 1회 재시도 |
| `mobile/lib/auth/api.test.ts` | 위 테스트 (이 계획에서 가장 중요한 테스트) |
| `mobile/lib/auth/session.ts` | `login` / `logout` / `withdraw` / `restore` |
| `mobile/lib/auth/session.test.ts` | 위 테스트 |
| `mobile/lib/profile.ts` | `fetchMe()` |
| `mobile/lib/favorites.ts` | `toggleFavorite()` |
| `mobile/hooks/use-me.ts` | `useQuery(['me'])` |
| `mobile/hooks/use-favorite.ts` | 찜 mutation + 캐시 낙관적 갱신 |
| `mobile/app/login.tsx` | 로그인 화면 (탭바를 덮는 루트 스택 화면) |
| `mobile/components/auth/login-form.tsx` | 로그인 폼. **화면과 분리** — 소셜 바퀴에 2단계로 쪼갤 때 그대로 옮기려고 |
| `mobile/app/(tabs)/(my)/_layout.tsx` | 마이 탭 스택 (다음 바퀴의 목록 화면들이 여기 붙는다) |
| `mobile/app/(tabs)/(my)/index.tsx` | 마이페이지 |
| `mobile/components/my/section-card.tsx` | 「고객지원」·「계정」 같은 카드 한 장 |
| `mobile/components/my/withdraw-modal.tsx` | 탈퇴 모달 |
| `mobile/components/product-detail/favorite-button.tsx` | 상세의 찜 버튼 |

**앱 — 고치는 파일**

| 경로 | 무엇을 |
|---|---|
| `mobile/app/_layout.tsx` | 앱 시작 시 `restore()` 호출 + `login` 스택 화면 등록 |
| `mobile/app/(tabs)/_layout.tsx` | Explore 탭 → 「마이」 탭 교체 + 게스트 탭 누름 가로채기 |
| `mobile/components/ui/icon-symbol.tsx` | 아이콘 매핑 3개 추가 (하트 2종, 사람) |
| `mobile/app/(tabs)/(home)/products/[id].tsx` | 판매자 카드 아래에 찜 버튼 |
| `mobile/package.json` | 의존성 2개 |

**앱 — 지우는 파일**

| 경로 | 이유 |
|---|---|
| `mobile/app/(tabs)/explore.tsx` | Expo 템플릿 빈 껍데기. 「마이」가 그 자리를 가져간다 |

**웹 — 고치는 파일**

| 경로 | 무엇을 |
|---|---|
| `src/features/login/Login.tsx` | 모바일 폭 전용 문구 제거 |
| `src/features/my-page/MyPage.tsx` | 「고객지원」 아래에 「계정」 카드 추가 |

---

## Task 1: 의존성 + 토큰 저장소

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/lib/auth/tokens.ts`
- Test: `mobile/lib/auth/tokens.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 작업)
- Produces:
  - `interface StoredTokens { accessToken: string; refreshToken: string }`
  - `saveTokens(tokens: StoredTokens): Promise<void>`
  - `saveAccessToken(accessToken: string): Promise<void>`
  - `loadTokens(): Promise<StoredTokens | null>`
  - `clearTokens(): Promise<void>`

- [ ] **Step 1: 의존성 설치**

`expo-secure-store`는 Expo 패키지라 SDK 54에 맞는 버전이 골라지도록 `expo install`을 쓴다. `zustand`는 Expo 패키지가 아니라 일반 설치.

```bash
cd mobile
npx expo install expo-secure-store
pnpm add zustand@^5.0.11
```

`zustand` 버전은 웹(`package.json`의 `^5.0.11`)과 맞춘 것이다.

- [ ] **Step 2: 설치 확인**

```bash
cd mobile && node -e "const p=require('./package.json'); console.log(p.dependencies['expo-secure-store'], p.dependencies['zustand'])"
```

Expected: `expo-secure-store` 버전(`~15.x` 형태)과 `^5.0.11` 두 값이 출력된다. `undefined`가 나오면 설치가 안 된 것.

- [ ] **Step 3: 실패하는 테스트 작성**

Create `mobile/lib/auth/tokens.test.ts`:

```ts
// expo-secure-store는 네이티브 모듈이라 jest에서 돌지 않는다.
// 세 함수만 가짜로 갈아끼워, "무엇을 어떤 키로 부르는지"만 검증한다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

import { clearTokens, loadTokens, saveAccessToken, saveTokens } from './tokens';

const mockSet = SecureStore.setItemAsync as jest.Mock;
const mockGet = SecureStore.getItemAsync as jest.Mock;
const mockDelete = SecureStore.deleteItemAsync as jest.Mock;

beforeEach(() => {
  mockSet.mockReset().mockResolvedValue(undefined);
  mockGet.mockReset();
  mockDelete.mockReset().mockResolvedValue(undefined);
});

describe('saveTokens', () => {
  it('두 토큰을 서로 다른 키에 나눠 저장한다', async () => {
    await saveTokens({ accessToken: 'a-token', refreshToken: 'r-token' });

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith('cuddle.accessToken', 'a-token');
    expect(mockSet).toHaveBeenCalledWith('cuddle.refreshToken', 'r-token');
  });

  it('저장이 실패해도 예외를 밖으로 던지지 않는다', async () => {
    // 저장 실패는 사용자가 할 수 있는 게 없다. 이번 세션은 메모리 토큰으로 계속 돈다.
    mockSet.mockRejectedValue(new Error('보안 저장소 오류'));

    await expect(saveTokens({ accessToken: 'a', refreshToken: 'r' })).resolves.toBeUndefined();
  });
});

describe('saveAccessToken', () => {
  it('액세스 토큰만 덮어쓴다(리프레시 토큰은 건드리지 않는다)', async () => {
    await saveAccessToken('new-a-token');

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('cuddle.accessToken', 'new-a-token');
  });
});

describe('loadTokens', () => {
  it('둘 다 있으면 두 토큰을 돌려준다', async () => {
    mockGet.mockImplementation(async (key: string) =>
      key === 'cuddle.accessToken' ? 'a-token' : 'r-token'
    );

    await expect(loadTokens()).resolves.toEqual({
      accessToken: 'a-token',
      refreshToken: 'r-token',
    });
  });

  it('리프레시 토큰이 없으면 null이다', async () => {
    // 리프레시 토큰이 없으면 만료됐을 때 되살릴 방법이 없다 → 없는 것으로 친다.
    mockGet.mockImplementation(async (key: string) =>
      key === 'cuddle.accessToken' ? 'a-token' : null
    );

    await expect(loadTokens()).resolves.toBeNull();
  });

  it('읽기가 실패하면 null이다', async () => {
    mockGet.mockRejectedValue(new Error('보안 저장소 오류'));

    await expect(loadTokens()).resolves.toBeNull();
  });
});

describe('clearTokens', () => {
  it('두 키를 모두 지운다', async () => {
    await clearTokens();

    expect(mockDelete).toHaveBeenCalledWith('cuddle.accessToken');
    expect(mockDelete).toHaveBeenCalledWith('cuddle.refreshToken');
  });
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/auth/tokens.test.ts
```

Expected: FAIL — `Cannot find module './tokens'`

- [ ] **Step 5: 구현**

Create `mobile/lib/auth/tokens.ts`:

```ts
import * as SecureStore from 'expo-secure-store';

// 토큰을 기기에 저장한다. SecureStore를 아는 파일은 여기 하나뿐이라,
// 나중에 저장 수단을 바꿔도 다른 파일은 손대지 않는다.
//
// 왜 키를 두 개로 나누나:
// SecureStore는 값 하나당 약 2048바이트 제한이 있다(SDK 54 문서).
// 웹처럼 {user, accessToken, refreshToken}을 한 덩어리 JSON으로 넣으면
// JWT 두 개가 합쳐져 제한을 넘길 수 있다. 값마다 키를 나누면 각각 여유가 있다.

const ACCESS_TOKEN_KEY = 'cuddle.accessToken';
const REFRESH_TOKEN_KEY = 'cuddle.refreshToken';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

/** 로그인 직후 두 토큰을 함께 저장한다. */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  } catch (error) {
    // 저장이 실패해도 이번 세션은 메모리 토큰으로 정상 동작한다.
    // 다만 앱을 재시작하면 로그인이 풀린다 — 그 원인을 개발 중에 찾을 수 있게 남긴다.
    console.warn('[auth] 토큰 저장 실패. 앱을 다시 켜면 로그인이 유지되지 않습니다.', error);
  }
}

/** 갱신으로 새로 받은 액세스 토큰만 덮어쓴다. */
export async function saveAccessToken(accessToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  } catch (error) {
    console.warn('[auth] 액세스 토큰 저장 실패.', error);
  }
}

/** 앱 시작 시 기기에 남아 있는 토큰을 읽는다. 하나라도 없으면 null. */
export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);

    // 리프레시 토큰이 없으면 만료됐을 때 되살릴 방법이 없다 → 없는 것으로 친다.
    if (!accessToken || !refreshToken) return null;

    return { accessToken, refreshToken };
  } catch (error) {
    console.warn('[auth] 토큰 읽기 실패. 로그아웃 상태로 시작합니다.', error);
    return null;
  }
}

/** 로그아웃 · 탈퇴 · 갱신 실패 시 기기에서 완전히 지운다. */
export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.warn('[auth] 토큰 삭제 실패.', error);
  }
}
```

- [ ] **Step 6: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/auth/tokens.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 7: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: 출력 없음(오류 0)

- [ ] **Step 8: 커밋**

```bash
git add mobile/package.json mobile/lib/auth/tokens.ts mobile/lib/auth/tokens.test.ts ../pnpm-lock.yaml
git commit -m "feat(mobile): SecureStore 토큰 저장소 (#784)"
```

> `pnpm-lock.yaml`은 저장소 루트에 있다. `mobile/`에서 커밋할 때 경로가 `../pnpm-lock.yaml`인 이유. 루트에서 실행한다면 `pnpm-lock.yaml`로 쓴다.

---

## Task 2: 인증 상태 store

**Files:**
- Create: `mobile/lib/auth/store.ts`
- Test: `mobile/lib/auth/store.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type AuthStatus = 'restoring' | 'authed' | 'guest'`
  - `useAuthStore` — zustand store. 상태: `{ status: AuthStatus; accessToken: string | null; refreshToken: string | null }`
  - 액션: `setSession({ accessToken, refreshToken }): void` · `setAccessToken(accessToken: string): void` · `clearSession(): void`
  - 리액트 밖에서는 `useAuthStore.getState()`로 읽는다.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `mobile/lib/auth/store.test.ts`:

```ts
import { useAuthStore } from './store';

beforeEach(() => {
  // 테스트끼리 상태가 새지 않도록 초기값으로 되돌린다.
  useAuthStore.setState({ status: 'restoring', accessToken: null, refreshToken: null });
});

describe('useAuthStore', () => {
  it('처음에는 복원 중 상태다', () => {
    // 앱을 켠 직후에는 로그인인지 아닌지 아직 모른다.
    // 'guest'로 시작하면 복원되기 전에 로그인 화면으로 밀려날 수 있다.
    expect(useAuthStore.getState().status).toBe('restoring');
  });

  it('setSession은 두 토큰을 담고 authed가 된다', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });

    const state = useAuthStore.getState();
    expect(state.status).toBe('authed');
    expect(state.accessToken).toBe('a');
    expect(state.refreshToken).toBe('r');
  });

  it('setAccessToken은 액세스 토큰만 바꾼다', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });
    useAuthStore.getState().setAccessToken('a2');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('a2');
    expect(state.refreshToken).toBe('r');
    expect(state.status).toBe('authed');
  });

  it('clearSession은 토큰을 비우고 guest가 된다', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('guest');
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/auth/store.test.ts
```

Expected: FAIL — `Cannot find module './store'`

- [ ] **Step 3: 구현**

Create `mobile/lib/auth/store.ts`:

```ts
import { create } from 'zustand';

// 로그인 상태와 메모리 토큰. 화면들이 구독하고, 리액트 밖(apiFetch)에서는
// getState()로 읽는다.
//
// 왜 React Context가 아닌가:
// apiFetch는 리액트 컴포넌트가 아니라서 Context를 읽을 수 없다. Context로 가면
// "Context용 상태"와 "래퍼가 읽을 모듈 변수"를 둘 다 두고 손으로 맞춰야 하고,
// 어긋나면 로그인은 됐는데 요청에 토큰이 안 붙는 증상이 난다.
//
// 왜 persist를 안 쓰나:
// zustand persist는 상태를 통째로 한 키에 넣는데, SecureStore는 값 하나당 ~2KB
// 제한이 있다. 저장은 tokens.ts가 키를 나눠서 맡는다.

/**
 * restoring — 앱을 켠 직후. 기기에 토큰이 있는지 아직 읽는 중.
 * authed    — 토큰이 있다. (서버에서 아직 살아있는지는 첫 요청 때 밝혀진다)
 * guest     — 토큰이 없다.
 */
export type AuthStatus = 'restoring' | 'authed' | 'guest';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;

  setSession: (tokens: { accessToken: string; refreshToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'restoring',
  accessToken: null,
  refreshToken: null,

  setSession: ({ accessToken, refreshToken }) =>
    set({ status: 'authed', accessToken, refreshToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  clearSession: () => set({ status: 'guest', accessToken: null, refreshToken: null }),
}));
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/auth/store.test.ts
```

Expected: PASS — 4 tests

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/auth/store.ts mobile/lib/auth/store.test.ts
git commit -m "feat(mobile): 인증 상태 store (#784)"
```

---

## Task 3: apiFetch — 토큰 부착 + 401 갱신

이 계획에서 **가장 중요한 작업**이다. 눈으로 재현하기 어렵고 조용히 틀리기 쉬운 곳이라 테스트를 두껍게 덮는다.

**Files:**
- Create: `mobile/lib/auth/api.ts`
- Test: `mobile/lib/auth/api.test.ts`

**Interfaces:**
- Consumes: Task 1의 `saveAccessToken` · `clearTokens`, Task 2의 `useAuthStore`
- Produces:
  - `apiBaseUrl(): string` — `EXPO_PUBLIC_API_BASE_URL`을 읽고 없으면 던진다
  - `apiFetch(path: string, init?: RequestInit): Promise<Response>` — `path`는 `/profile/me`처럼 슬래시로 시작하는 상대 경로

- [ ] **Step 1: 실패하는 테스트 작성**

Create `mobile/lib/auth/api.test.ts`:

```ts
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

import { apiFetch } from './api';
import { useAuthStore } from './store';

const mockFetch = jest.fn();

// products.test.ts와 같은 결: 진짜 Response 대신 필요한 필드만 가진 객체를 쓴다.
function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined;
  return init?.headers?.Authorization;
}

beforeEach(() => {
  mockFetch.mockReset();
  (SecureStore.setItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  (SecureStore.deleteItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'old-token', refreshToken: 'r-token' });
});

describe('apiFetch', () => {
  it('액세스 토큰을 Bearer로 붙여 보낸다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: 'ok' }));

    await apiFetch('/profile/me');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/profile/me');
    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer old-token');
  });

  it('401이 아니면 갱신하지 않고 그대로 돌려준다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('401이면 갱신한 뒤 원래 요청을 딱 1번 재시도한다', async () => {
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { data: { accessToken: 'new-token' } }))
      .mockResolvedValueOnce(reply(200, { data: 'ok' }));

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // 두 번째 호출이 갱신 요청
    expect(mockFetch.mock.calls[1][0]).toBe('https://test.local/api/auth/refresh');
    // 세 번째 호출(재시도)에는 새 토큰이 붙어야 한다
    expect(authHeaderOf(mockFetch.mock.calls[2])).toBe('Bearer new-token');
    // 새 토큰이 store와 기기 양쪽에 반영됐는지
    expect(useAuthStore.getState().accessToken).toBe('new-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.accessToken', 'new-token');
  });

  it('재시도가 또 401이어도 무한 반복하지 않는다', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      String(url).endsWith('/auth/refresh')
        ? reply(200, { data: { accessToken: 'new-token' } })
        : reply(401)
    );

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(401);
    // 원요청 1 + 갱신 1 + 재시도 1 = 3. 그 이상이면 재시도가 반복되고 있는 것.
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('동시에 401을 맞은 요청 3개가 있어도 갱신은 1번만 한다', async () => {
    let refreshCalls = 0;
    mockFetch.mockImplementation(async (url: string, init?: { headers?: Record<string, string> }) => {
      if (String(url).endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return reply(200, { data: { accessToken: 'new-token' } });
      }
      return init?.headers?.Authorization === 'Bearer new-token' ? reply(200) : reply(401);
    });

    const results = await Promise.all([apiFetch('/a'), apiFetch('/b'), apiFetch('/c')]);

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
  });

  it('갱신에 실패하면 토큰을 지우고 게스트가 된다', async () => {
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(401)); // 갱신도 401

    const res = await apiFetch('/profile/me');

    // 화면을 강제로 옮기지는 않는다. 원래 요청의 실패를 그대로 돌려준다(설계 §7.3).
    expect(res.status).toBe(401);
    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cuddle.accessToken');
  });

  it('리프레시 토큰이 없으면 갱신을 시도조차 하지 않는다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'old-token', refreshToken: null });
    mockFetch.mockResolvedValue(reply(401));

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('guest');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/auth/api.test.ts
```

Expected: FAIL — `Cannot find module './api'`

- [ ] **Step 3: 구현**

Create `mobile/lib/auth/api.ts`:

```ts
import { useAuthStore } from './store';
import { clearTokens, saveAccessToken } from './tokens';

// 인증이 필요한 요청은 전부 여기를 지난다.
// 하는 일 두 가지: (1) 액세스 토큰을 Bearer로 붙인다 (2) 401이면 갱신하고 한 번 재시도한다.
//
// 웹(src/lib/api/api.ts)은 axios 인터셉터로 같은 일을 하지만, 앱은 이미 fetch로
// 통일돼 있어(mobile/lib/products.ts) 래퍼 함수 하나면 충분하다.

/** EXPO_PUBLIC_* 는 빌드 시 인라인된다. 누락되면 조용히 `fetch("undefined/...")`로 실패하지 않게 먼저 던진다. */
export function apiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다. mobile/.env를 확인하세요.');
  }
  return url;
}

// 갱신이 도는 동안의 약속을 하나만 들고 있는다.
// 화면 여러 개가 동시에 401을 맞아도 서버에는 갱신 요청이 한 번만 간다.
let refreshPromise: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  const res = await fetch(`${apiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const body = (await res.json()) as { data?: { accessToken?: string } };
  const accessToken = body?.data?.accessToken;
  if (!accessToken) return null;

  useAuthStore.getState().setAccessToken(accessToken);
  await saveAccessToken(accessToken);
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken()
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * 인증이 필요한 요청을 보낸다.
 * @param path `/profile/me`처럼 슬래시로 시작하는 상대 경로
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  };

  const res = await send(useAuthStore.getState().accessToken);
  if (res.status !== 401) return res;

  const newToken = await refreshAccessToken();

  if (!newToken) {
    // 갱신 실패 = 세션이 끝났다. 기기와 메모리를 비우되 화면을 강제로 옮기지는 않는다.
    // (웹은 로그인 페이지로 밀어내지만, 앱에서 그러면 상품 보다가 통째로 튕긴다)
    await clearTokens();
    useAuthStore.getState().clearSession();
    return res;
  }

  // 재시도는 여기 한 줄뿐이다. 이게 또 401이어도 그대로 반환되므로 반복될 수 없다.
  return send(newToken);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/auth/api.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 5: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: 출력 없음

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/auth/api.ts mobile/lib/auth/api.test.ts
git commit -m "feat(mobile): apiFetch 401 토큰 갱신 (#784)"
```

---

## Task 4: 세션 흐름 (login / logout / withdraw / restore)

**Files:**
- Create: `mobile/lib/auth/session.ts`
- Test: `mobile/lib/auth/session.test.ts`

**Interfaces:**
- Consumes: Task 1(`saveTokens` · `loadTokens` · `clearTokens`), Task 2(`useAuthStore`), Task 3(`apiFetch` · `apiBaseUrl`)
- Produces:
  - `class InvalidCredentialsError extends Error`
  - `login(email: string, password: string): Promise<void>`
  - `restore(): Promise<void>`
  - `logout(queryClient: QueryClient): Promise<void>`
  - `withdraw(queryClient: QueryClient, input: { reason: string; detailReason: string }): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `mobile/lib/auth/session.test.ts`:

```ts
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import { QueryClient } from '@tanstack/react-query';

import { InvalidCredentialsError, login, logout, restore, withdraw } from './session';
import { useAuthStore } from './store';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  mockFetch.mockReset();
  (SecureStore.setItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  (SecureStore.getItemAsync as jest.Mock).mockReset();
  (SecureStore.deleteItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'restoring', accessToken: null, refreshToken: null });
});

describe('login', () => {
  it('성공하면 토큰을 store와 기기 양쪽에 넣는다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, { data: { accessToken: 'a', refreshToken: 'r', user: { id: 1 } } })
    );

    await login('me@cuddle.com', 'pw');

    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().accessToken).toBe('a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.accessToken', 'a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.refreshToken', 'r');
  });

  it('400이면 InvalidCredentialsError를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(400));

    await expect(login('me@cuddle.com', 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(useAuthStore.getState().status).toBe('restoring');
  });

  it('500이면 일반 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    await expect(login('me@cuddle.com', 'pw')).rejects.not.toBeInstanceOf(InvalidCredentialsError);
  });
});

describe('restore', () => {
  it('기기에 토큰이 있으면 authed로 되살린다', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
      key === 'cuddle.accessToken' ? 'a' : 'r'
    );

    await restore();

    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().accessToken).toBe('a');
  });

  it('토큰이 없으면 guest가 된다', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    await restore();

    expect(useAuthStore.getState().status).toBe('guest');
  });
});

describe('logout', () => {
  it('서버 호출이 실패해도 기기 정리는 진행한다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'a', refreshToken: 'r' });
    // 로그아웃 API가 통째로 터지는 상황
    mockFetch.mockRejectedValue(new Error('네트워크 없음'));
    const queryClient = new QueryClient();

    await logout(queryClient);

    // 기기에 토큰이 남으면 "로그아웃했는데 로그인돼 있는" 상태가 된다.
    expect(useAuthStore.getState().status).toBe('guest');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cuddle.accessToken');
  });
});

describe('withdraw', () => {
  it('성공하면 로그아웃과 같은 정리를 한다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'a', refreshToken: 'r' });
    mockFetch.mockResolvedValue(reply(200));
    const queryClient = new QueryClient();

    await withdraw(queryClient, { reason: 'LOW_USAGE', detailReason: '' });

    expect(useAuthStore.getState().status).toBe('guest');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cuddle.refreshToken');
  });

  it('실패하면 던지고 세션은 그대로 둔다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'a', refreshToken: 'r' });
    mockFetch.mockResolvedValue(reply(500));
    const queryClient = new QueryClient();

    await expect(
      withdraw(queryClient, { reason: 'LOW_USAGE', detailReason: '' })
    ).rejects.toThrow();
    // 탈퇴가 안 됐는데 로그아웃시키면 사용자가 상황을 오해한다.
    expect(useAuthStore.getState().status).toBe('authed');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd mobile && npx jest lib/auth/session.test.ts
```

Expected: FAIL — `Cannot find module './session'`

- [ ] **Step 3: 구현**

Create `mobile/lib/auth/session.ts`:

```ts
import type { QueryClient } from '@tanstack/react-query';

import { apiBaseUrl, apiFetch } from './api';
import { useAuthStore } from './store';
import { clearTokens, loadTokens, saveTokens } from './tokens';

// 서버 · 메모리 store · 기기 저장소 세 곳을 한 번에 맞추는 자리.
// 화면은 여기 함수만 부르고, 세 곳을 각각 건드리지 않는다.

/** 이메일이나 비밀번호가 틀렸을 때. 화면에서 다른 오류와 문구를 구분하려고 따로 둔다. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('이메일 또는 비밀번호가 일치하지 않습니다.');
    this.name = 'InvalidCredentialsError';
  }
}

interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * 이메일 · 비밀번호로 로그인한다.
 * apiFetch가 아니라 순수 fetch를 쓰는 이유: 로그인은 토큰이 필요 없는 요청이고,
 * 401을 갱신 흐름으로 끌고 갈 이유도 없다. (웹도 로그인만 raw axios를 쓴다)
 */
export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 400 || res.status === 401) {
    throw new InvalidCredentialsError();
  }
  if (!res.ok) {
    throw new Error(`로그인에 실패했어요 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as LoginResponse;
  const { accessToken, refreshToken } = body.data;

  useAuthStore.getState().setSession({ accessToken, refreshToken });
  await saveTokens({ accessToken, refreshToken });
}

/**
 * 앱을 켤 때 기기에 남은 토큰으로 세션을 되살린다.
 * 토큰이 서버에서 아직 살아있는지는 여기서 확인하지 않는다 — 확인될 때까지 기다리면
 * 앱 실행이 매번 느려진다. 첫 요청이 401을 맞으면 그때 apiFetch가 정리한다.
 */
export async function restore(): Promise<void> {
  const tokens = await loadTokens();

  if (!tokens) {
    useAuthStore.getState().clearSession();
    return;
  }

  useAuthStore.getState().setSession(tokens);
}

/** 기기 정리는 서버 호출 성공 여부와 상관없이 반드시 한다. */
async function clearLocalSession(queryClient: QueryClient): Promise<void> {
  await clearTokens();
  useAuthStore.getState().clearSession();
  // 남의 찜 정보 같은 잔상이 다음 사용자에게 보이지 않도록 캐시를 통째로 비운다.
  queryClient.clear();
}

export async function logout(queryClient: QueryClient): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // 서버에 못 알려도 계속 진행한다. 기기에 토큰이 남는 쪽이 훨씬 나쁘다.
  } finally {
    await clearLocalSession(queryClient);
  }
}

export async function withdraw(
  queryClient: QueryClient,
  input: { reason: string; detailReason: string }
): Promise<void> {
  const res = await apiFetch('/auth/withdraw', {
    method: 'DELETE',
    body: JSON.stringify({ reason: input.reason, detailReason: input.detailReason }),
  });

  if (!res.ok) {
    // 탈퇴가 안 됐는데 로그아웃시키면 사용자가 "탈퇴됐구나"로 오해한다. 세션을 그대로 둔다.
    throw new Error(`탈퇴에 실패했어요 (HTTP ${res.status})`);
  }

  await clearLocalSession(queryClient);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
cd mobile && npx jest lib/auth/session.test.ts
```

Expected: PASS — 8 tests

- [ ] **Step 5: 전체 테스트 + 타입체크**

```bash
cd mobile && npx jest && npx tsc --noEmit
```

Expected: 6개 스위트, 38 tests 통과 / 타입 오류 없음
(기존 12 + tokens 7 + store 4 + api 7 + session 8 = 38)

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/auth/session.ts mobile/lib/auth/session.test.ts
git commit -m "feat(mobile): 세션 흐름 login/logout/withdraw/restore (#784)"
```

---

## Task 5: 내 프로필 조회 + 앱 시작 복원 연결

**Files:**
- Create: `mobile/lib/profile.ts`
- Create: `mobile/hooks/use-me.ts`
- Modify: `mobile/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 2(`useAuthStore`), Task 3(`apiFetch`), Task 4(`restore`)
- Produces:
  - `interface MyProfile { id: number; nickname: string; profileImageUrl: string | null; addressSido: string | null; addressGugun: string | null }`
  - `fetchMe(): Promise<MyProfile>`
  - `useMe(): UseQueryResult<MyProfile>` — 쿼리 키는 `['me']`

- [ ] **Step 1: 프로필 API 작성**

Create `mobile/lib/profile.ts`:

```ts
import { apiFetch } from '@/lib/auth/api';

// 내 프로필. 저장하지 않고 앱을 켤 때마다 새로 받는다.
// 저장하면 닉네임 · 사진을 바꿔도 앱에 옛날 값이 남고, SecureStore 용량도 먹는다.

/**
 * 서버는 이보다 많은 필드를 주지만 앱이 쓰는 것만 적는다.
 * 웹 `src/types/user.ts`의 User를 통째로 @cuddle/shared에 올리지 않는 이유:
 * 앱이 실제로 쓰는 건 4개뿐이라, 지금 올리면 공유 표면만 넓어지고 드리프트 위험이 는다.
 */
export interface MyProfile {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  addressSido: string | null;
  addressGugun: string | null;
}

interface MyProfileResponse {
  data: MyProfile;
}

export async function fetchMe(): Promise<MyProfile> {
  const res = await apiFetch('/profile/me');

  if (!res.ok) {
    throw new Error(`내 정보를 불러오지 못했어요 (HTTP ${res.status})`);
  }

  const body = (await res.json()) as MyProfileResponse;
  return body.data;
}
```

- [ ] **Step 2: 훅 작성**

Create `mobile/hooks/use-me.ts`:

```ts
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/lib/auth/store';
import { fetchMe } from '@/lib/profile';

/**
 * 내 프로필.
 * 'authed'일 때만 요청한다 — 게스트일 때 부르면 401만 받고 갱신 흐름이 헛돈다.
 * 'restoring'(앱 켠 직후)에도 아직 부르지 않는다.
 */
export function useMe() {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: status === 'authed',
  });
}
```

- [ ] **Step 3: 앱 시작 시 복원 + 로그인 화면 등록**

Modify `mobile/app/_layout.tsx` — 전체 내용을 아래로 바꾼다:

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { restore } from '@/lib/auth/session';

export const unstable_settings = {
  anchor: '(tabs)',
};

// TanStack Query 클라이언트는 앱 생명주기 동안 1개만 유지(모듈 스코프).
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 기기에 남은 토큰으로 세션을 되살린다. 앱 실행당 한 번.
  // 결과를 기다리며 화면을 붙잡지 않는다 — 수십 ms지만 매 실행마다 느려 보인다.
  useEffect(() => {
    restore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* 로그인은 탭바까지 통째로 덮는다. 닫으면 원래 보던 자리로 돌아가므로
              웹처럼 redirectUrl을 들고 다닐 필요가 없다. */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: 타입체크**

```bash
cd mobile && npx tsc --noEmit
```

Expected: 출력 없음.
(`login` 라우트 파일은 Task 6에서 만든다. expo-router는 없는 이름의 `Stack.Screen`을 타입 오류로 잡지 않고 런타임에 무시하므로 여기서는 통과한다. 만약 `.expo/types` 자동 생성 타입 때문에 오류가 난다면 Task 6을 먼저 끝내고 이 단계를 다시 실행한다.)

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/profile.ts mobile/hooks/use-me.ts mobile/app/_layout.tsx
git commit -m "feat(mobile): 내 프로필 조회 + 앱 시작 세션 복원 (#784)"
```

---

## Task 6: 로그인 화면

**Files:**
- Create: `mobile/components/auth/login-form.tsx`
- Create: `mobile/app/login.tsx`

**Interfaces:**
- Consumes: Task 4(`login` · `InvalidCredentialsError`)
- Produces: `<LoginForm onSuccess={() => void} />` — 폼만. 헤더 · 화면 배치는 `app/login.tsx`가 맡는다.

**왜 폼을 화면과 분리하나:** 소셜 바퀴에서 로그인 화면이 2단계(방법 고르기 → 이메일 폼)로 쪼개진다. 그때 이 폼을 통째로 두 번째 화면에 옮기기만 하면 된다. (설계 §8.1)

- [ ] **Step 1: 로그인 폼 작성**

Create `mobile/components/auth/login-form.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { InvalidCredentialsError, login } from '@/lib/auth/session';

// 로그인 폼. 화면(app/login.tsx)과 분리해 둔다 —
// 소셜 바퀴에서 "방법 고르기 → 이메일 폼" 2단계로 쪼갤 때 이 조각을 그대로 옮긴다.
//
// 입력이 두 개뿐이라 폼 라이브러리(react-hook-form)를 새로 들이지 않고 손으로 검증한다.

interface Props {
  /** 로그인에 성공했을 때. 보통 화면을 닫는다. */
  onSuccess: () => void;
}

/** 아주 단순한 형태 검사. 진짜 존재하는 주소인지는 서버가 판단한다. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm({ onSuccess }: Props) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;

    if (!looksLikeEmail(email)) {
      setError('이메일 주소를 올바르게 입력해주세요.');
      return;
    }
    if (password.length === 0) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);

      // 비로그인 상태로 받아온 상품에는 isFavorite이 비어 있다.
      // 다시 받아야 하트가 채워진다(설계 §7.1).
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      onSuccess();
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        setError('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else if (err instanceof TypeError) {
        // fetch가 네트워크 자체에 실패하면 TypeError를 던진다.
        setError('인터넷 연결을 확인해주세요.');
      } else {
        setError('잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>이메일로 로그인하기</Text>

      <View style={styles.field}>
        <Text style={styles.label}>이메일 주소</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          placeholder="example@cuddle.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) setError(null);
          }}
          placeholder="비밀번호"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.submit,
          pressed && styles.submitPressed,
          submitting && styles.submitDisabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitLabel}>로그인</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  input: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
  },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  submitPressed: {
    opacity: 0.8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

- [ ] **Step 2: 로그인 화면 작성**

Create `mobile/app/login.tsx`:

```tsx
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginForm } from '@/components/auth/login-form';
import { IconSymbol } from '@/components/ui/icon-symbol';

// 로그인. 탭바까지 덮는 루트 스택 화면이라, 닫으면 원래 보던 자리로 돌아간다.
//
// 헤더를 직접 그리는 이유는 상세 화면(detail-header.tsx)과 같다:
// native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다.

const HEADER_HEIGHT = 52;

export default function LoginScreen() {
  const router = useRouter();

  // 취소하고 돌아갈 곳이 없는 경우(딥링크 등)를 대비해 홈으로 떨어뜨린다.
  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
      </View>

      {/* 키보드가 올라와도 로그인 버튼이 가려지지 않게 화면을 밀어 올린다. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <LoginForm onSuccess={close} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backPressed: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
});
```

- [ ] **Step 3: 타입체크 + 린트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

Expected: 타입 오류 없음, 린트 경고 없음

- [ ] **Step 4: 실기기 확인**

```bash
cd mobile && pnpm expo start
```

Expo Go로 열고 확인:
- 아직 로그인 화면으로 가는 버튼이 없으므로, Expo Go 개발 메뉴 대신 **주소로 직접 연다**: 터미널에서 `w`를 눌러 웹으로 열지 말고, 앱에서 확인하려면 다음 Task 7까지 진행한 뒤 마이 탭으로 확인한다.
- 이 단계에서는 **타입체크 · 린트 통과만 확인하고 넘어가도 된다.**

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/auth/login-form.tsx mobile/app/login.tsx
git commit -m "feat(mobile): 로그인 화면 (#784)"
```

---

## Task 7: Explore 탭 → 「마이」 탭 교체 + 게스트 탭 누름 가로채기

**Files:**
- Create: `mobile/app/(tabs)/(my)/_layout.tsx`
- Create: `mobile/app/(tabs)/(my)/index.tsx` (이 작업에서는 뼈대만, Task 8에서 채운다)
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Modify: `mobile/components/ui/icon-symbol.tsx`
- Delete: `mobile/app/(tabs)/explore.tsx`

**Interfaces:**
- Consumes: Task 2(`useAuthStore`)
- Produces: `(my)` 탭 라우트. Task 8이 `index.tsx`를 채운다.

- [ ] **Step 1: 아이콘 매핑 추가**

Modify `mobile/components/ui/icon-symbol.tsx` — `MAPPING` 객체에 3줄 추가:

```tsx
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'person.crop.circle': 'person',
  heart: 'favorite-border',
  'heart.fill': 'favorite',
} as IconMapping;
```

- [ ] **Step 2: 마이 탭 스택 레이아웃 작성**

Create `mobile/app/(tabs)/(my)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

// 마이 탭 안의 스택. 지금은 화면이 하나뿐이지만, 다음 바퀴의
// 찜한 상품 · 내 상품 목록이 여기 쌓인다(탭바를 유지한 채로).
// 헤더는 각 화면이 직접 그린다 — 홈 · 상세와 같은 방식.

export default function MyLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: 마이페이지 뼈대 작성**

Create `mobile/app/(tabs)/(my)/index.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 마이페이지. 내용은 Task 8에서 채운다.

export default function MyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});
```

- [ ] **Step 4: 탭 레이아웃 교체**

Modify `mobile/app/(tabs)/_layout.tsx` — 전체 내용을 아래로 바꾼다:

```tsx
import { Tabs, useRouter } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(my)"
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
          ),
        }}
        // 게스트가 마이 탭을 누르면 탭을 열지 않고 로그인 화면만 띄운다.
        //
        // 왜 마이 화면 안에서 밀어내지 않나:
        // 그러면 로그인을 취소했을 때 마이 화면으로 돌아오고, 마이 화면이 또 밀어내서
        // 빠져나갈 수 없는 무한 루프가 된다. 탭 전환 자체를 막으면 원래 보던 탭이
        // 그대로 남아 있어서, 취소하면 자연스럽게 거기로 돌아간다.
        //
        // 'restoring'(앱 켠 직후)일 때는 막지 않는다 — 로그인돼 있는데도 밀어내면 안 된다.
        // 그 짧은 사이에 열리면 마이 화면이 로딩 표시를 보여준다.
        listeners={{
          tabPress: (event) => {
            if (useAuthStore.getState().status === 'guest') {
              event.preventDefault();
              router.push('/login');
            }
          },
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 5: Explore 탭 삭제**

```bash
git rm mobile/app/\(tabs\)/explore.tsx
```

- [ ] **Step 6: 타입체크 + 린트 + 전체 테스트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Expected: 타입 오류 없음 / 린트 경고 없음 / 38 tests 통과

> `explore.tsx`가 쓰던 `Collapsible` · `ExternalLink` · `ParallaxScrollView` 등은 이제 아무도 안 쓰지만 **지우지 않는다.** 이 작업의 범위가 아니고, 지웠다가 되살리는 비용이 더 크다.

- [ ] **Step 7: 실기기 확인**

```bash
cd mobile && pnpm expo start
```

- 탭바가 `홈` · `마이` 두 개인지
- 로그아웃 상태에서 「마이」를 누르면 **로그인 화면이 뜨고**, `‹`로 닫으면 **원래 보던 홈 탭에 남는지** (마이 탭으로 전환되지 않아야 함)
- 로그인 화면에서 틀린 비밀번호 → "이메일 또는 비밀번호가 일치하지 않습니다"
- 맞는 계정 → 화면이 닫히고, 다시 「마이」를 누르면 이번엔 마이 탭이 열리는지

- [ ] **Step 8: 커밋**

```bash
git add mobile/app/\(tabs\)/_layout.tsx mobile/app/\(tabs\)/\(my\)/ mobile/components/ui/icon-symbol.tsx
git commit -m "feat(mobile): Explore 탭을 마이 탭으로 교체 + 게스트 로그인 유도 (#784)"
```

---

## Task 8: 마이페이지 (프로필 · 고객지원 · 계정)

**Files:**
- Create: `mobile/components/my/section-card.tsx`
- Modify: `mobile/app/(tabs)/(my)/index.tsx`

**Interfaces:**
- Consumes: Task 4(`logout`), Task 5(`useMe`), Task 2(`useAuthStore`)
- Produces:
  - `<SectionCard title={string}>{children}</SectionCard>`
  - `<SectionRow label={string} onPress={() => void} tone?: 'default' | 'danger' />`

- [ ] **Step 1: 카드 조각 작성**

Create `mobile/components/my/section-card.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

// 마이페이지의 카드 한 장. 웹 모바일 마이페이지와 같은 결
// (제목 + 오른쪽 화살표가 달린 줄 목록).

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

interface SectionRowProps {
  label: string;
  onPress: () => void;
  /** danger는 되돌리기 어려운 동작(탈퇴)에만 쓴다. */
  tone?: 'default' | 'danger';
}

export function SectionRow({ label, onPress, tone = 'default' }: SectionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={[styles.rowLabel, tone === 'danger' && styles.rowLabelDanger]}>{label}</Text>
      <IconSymbol name="chevron.right" size={22} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.5,
  },
  rowLabel: {
    fontSize: 16,
    color: '#111827',
  },
  rowLabelDanger: {
    color: '#DC2626',
  },
});
```

- [ ] **Step 2: 마이페이지 채우기**

Modify `mobile/app/(tabs)/(my)/index.tsx` — 전체 내용을 아래로 바꾼다:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectionCard, SectionRow } from '@/components/my/section-card';
import { useMe } from '@/hooks/use-me';
import { logout } from '@/lib/auth/session';
import { useAuthStore } from '@/lib/auth/store';

// 마이페이지. 웹 모바일 마이페이지와 같은 카드 결.
//
// 「내 상품 관리」·「찜한 상품」 메뉴는 아직 넣지 않는다 —
// 눌러도 갈 화면이 없어서 "준비 중" 같은 군더더기가 생긴다. 다음 바퀴에 화면과 함께 넣는다.

const SUPPORT_MAIL = 'mailto:support@cuddlemarket.com?subject=커들마켓 1:1 문의';

export default function MyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const { data: me, isLoading } = useMe();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말로 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout(queryClient);
          // 게스트가 마이 탭에 남아 있을 이유가 없다. 홈으로 보낸다.
          router.replace('/');
        },
      },
    ]);
  };

  const renderBody = () => {
    // 게스트인데 이 화면이 열려 있는 건 정상 흐름이 아니다(탭 누름을 가로채므로).
    // 로그아웃 직후처럼 잠깐 스쳐 갈 때를 위한 안전망.
    if (status === 'guest') {
      return (
        <View style={styles.center}>
          <Text style={styles.centerText}>로그인이 필요합니다.</Text>
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          >
            <Text style={styles.loginButtonLabel}>로그인하기</Text>
          </Pressable>
        </View>
      );
    }

    if (status === 'restoring' || isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      );
    }

    const location = [me?.addressSido, me?.addressGugun].filter(Boolean).join(' ');

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {me?.profileImageUrl ? (
              <Image
                source={{ uri: me.profileImageUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {(me?.nickname ?? '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.nickname}>{me?.nickname ?? ''}</Text>
            {location ? <Text style={styles.location}>{location}</Text> : null}
          </View>
        </View>

        <SectionCard title="고객지원">
          <SectionRow label="고객센터" onPress={() => Linking.openURL(SUPPORT_MAIL)} />
        </SectionCard>

        {/* 「탈퇴하기」 줄은 Task 9에서 모달과 함께 넣는다.
            여기서 먼저 넣으면 눌러도 아무 일이 없는 줄이 생긴다. */}
        <SectionCard title="계정">
          <SectionRow label="로그아웃" onPress={handleLogout} />
        </SectionCard>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이</Text>
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
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  loginButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B7280',
  },
  profileText: {
    gap: 4,
  },
  nickname: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
  },
});
```

- [ ] **Step 3: 타입체크 + 린트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

Expected: 오류·경고 없음

- [ ] **Step 4: 실기기 확인**

- 로그인 후 「마이」 탭 → 닉네임과 지역이 보이는지
- 「고객센터」 → 메일 앱이 열리는지
- 「로그아웃」 → 확인 창 → 「로그아웃」 → 홈으로 이동하고, 「마이」를 다시 누르면 로그인 화면이 뜨는지
- **앱을 완전히 종료했다가 다시 열어** 로그인이 유지되는지 (SecureStore 확인)

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/my/section-card.tsx mobile/app/\(tabs\)/\(my\)/index.tsx
git commit -m "feat(mobile): 마이페이지 프로필·고객지원·계정 + 로그아웃 (#784)"
```

---

## Task 9: 탈퇴 모달

**Files:**
- Create: `mobile/components/my/withdraw-modal.tsx`
- Modify: `mobile/app/(tabs)/(my)/index.tsx`

**Interfaces:**
- Consumes: Task 4(`withdraw`)
- Produces: `<WithdrawModal visible={boolean} onClose={() => void} onDone={() => void} />`

**웹과 다른 점:** 웹은 사유를 드롭다운(`<select>`)으로 고르지만 RN엔 그런 기본 요소가 없다. 사유가 5개뿐이라 목록으로 펼쳐 하나 고르게 한다 (설계 §8.4).

- [ ] **Step 1: 탈퇴 모달 작성**

Create `mobile/components/my/withdraw-modal.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { withdraw } from '@/lib/auth/session';

// 회원 탈퇴. 웹 WithdrawModal과 같은 항목(사유 · 상세사유 · 주의사항 · 동의)을 담는다.
//
// 사유 선택만 방식이 다르다: 웹은 <select> 드롭다운이지만 RN엔 그런 기본 요소가 없다.
// 5개뿐이라 목록으로 펼치는 편이 탭 수도 적고 라이브러리도 필요 없다.

/** 웹 src/constants/constants.ts 의 WITHDRAW_REASON 과 같은 값. 서버가 아는 코드다. */
const WITHDRAW_REASONS = [
  { id: 'SERVICE_DISSATISFACTION', label: '서비스 불만족' },
  { id: 'PRIVACY_CONCERN', label: '개인정보 우려' },
  { id: 'LOW_USAGE', label: '사용 빈도 낮음' },
  { id: 'COMPETITOR', label: '경쟁 서비스 이용' },
  { id: 'OTHER', label: '기타' },
] as const;

/** 웹 WITH_DRAW_ALERT_LIST 와 같은 안내. */
const ALERTS = [
  '등록한 모든 상품이 삭제됩니다',
  '거래 내역과 채팅 기록이 모두 삭제됩니다',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 탈퇴가 끝났을 때. 보통 홈으로 보낸다. */
  onDone: () => void;
}

export function WithdrawModal({ visible, onClose, onDone }: Props) {
  const queryClient = useQueryClient();

  const [reason, setReason] = useState<string>(WITHDRAW_REASONS[0].id);
  const [detailReason, setDetailReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(WITHDRAW_REASONS[0].id);
    setDetailReason('');
    setAgreed(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!agreed || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      await withdraw(queryClient, { reason, detailReason: detailReason.trim() });
      reset();
      onDone();
    } catch {
      // 실패해도 세션은 그대로다(session.ts). 모달을 닫지 않고 다시 시도할 수 있게 둔다.
      setError('탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.heading}>회원탈퇴</Text>
            <Text style={styles.description}>정말로 탈퇴하시겠습니까?</Text>

            <View style={styles.alertBox}>
              {ALERTS.map((text) => (
                <Text key={text} style={styles.alertText}>
                  · {text}
                </Text>
              ))}
            </View>

            <Text style={styles.label}>탈퇴 사유</Text>
            <View style={styles.reasonList}>
              {WITHDRAW_REASONS.map((item) => {
                const selected = item.id === reason;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setReason(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      selected && styles.reasonRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                    <Text style={styles.reasonLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>탈퇴 상세 사유</Text>
            <TextInput
              style={styles.textarea}
              value={detailReason}
              onChangeText={setDetailReason}
              placeholder="탈퇴 사유를 입력해주세요."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Pressable
              onPress={() => setAgreed((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              style={({ pressed }) => [styles.agreeRow, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
              <Text style={styles.agreeLabel}>회원 탈퇴에 동의합니다.</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
              >
                <Text style={styles.cancelLabel}>취소</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!agreed || submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.confirm,
                  (!agreed || submitting) && styles.confirmDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLabel}>탈퇴하기</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  sheetContent: {
    padding: 20,
    gap: 10,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#6B7280',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  reasonList: {
    gap: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  reasonRowSelected: {
    backgroundColor: '#F3F4F6',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  reasonLabel: {
    fontSize: 15,
    color: '#111827',
  },
  textarea: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkboxChecked: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  agreeLabel: {
    fontSize: 14,
    color: '#111827',
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
```

- [ ] **Step 2: 마이페이지에 탈퇴 줄 + 모달 붙이기**

Modify `mobile/app/(tabs)/(my)/index.tsx` — 네 군데를 고친다.

**(1)** import 두 줄 추가:

```diff
+import { useState } from 'react';
 import {
   ActivityIndicator,
   Alert,
```

```diff
 import { SectionCard, SectionRow } from '@/components/my/section-card';
+import { WithdrawModal } from '@/components/my/withdraw-modal';
```

**(2)** 컴포넌트 본문에 상태 추가 (`const { data: me, isLoading } = useMe();` 아래):

```diff
   const { data: me, isLoading } = useMe();
+  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
```

**(3)** 「계정」 카드에 탈퇴 줄 추가:

```diff
-        {/* 「탈퇴하기」 줄은 Task 9에서 모달과 함께 넣는다.
-            여기서 먼저 넣으면 눌러도 아무 일이 없는 줄이 생긴다. */}
         <SectionCard title="계정">
           <SectionRow label="로그아웃" onPress={handleLogout} />
+          <SectionRow label="탈퇴하기" tone="danger" onPress={() => setIsWithdrawOpen(true)} />
         </SectionCard>
```

**(4)** 화면 맨 아래에 모달 렌더:

```diff
       {renderBody()}
+      <WithdrawModal
+        visible={isWithdrawOpen}
+        onClose={() => setIsWithdrawOpen(false)}
+        onDone={() => {
+          setIsWithdrawOpen(false);
+          router.replace('/');
+        }}
+      />
     </SafeAreaView>
```

- [ ] **Step 3: 타입체크 + 린트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

Expected: 오류·경고 없음

- [ ] **Step 4: 실기기 확인 — ⚠️ 테스트 계정으로만**

> **탈퇴하면 계정이 진짜 삭제된다.** 본 계정으로 누르지 말 것. 미리 만들어 둔 버릴 계정으로 로그인한 뒤 확인한다.

- 「탈퇴하기」 → 모달이 뜨는지
- 동의 체크 전에는 「탈퇴하기」 버튼이 흐리고 눌리지 않는지
- 사유를 고르면 그 줄만 선택 표시가 되는지
- 「취소」 → 닫히고, 다시 열면 입력이 초기화돼 있는지
- 동의 체크 후 「탈퇴하기」 → 홈으로 이동하고 게스트 상태가 되는지

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/my/withdraw-modal.tsx mobile/app/\(tabs\)/\(my\)/index.tsx
git commit -m "feat(mobile): 회원 탈퇴 모달 (#784)"
```

---

## Task 10: 찜 버튼

**Files:**
- Create: `mobile/lib/favorites.ts`
- Create: `mobile/hooks/use-favorite.ts`
- Create: `mobile/components/product-detail/favorite-button.tsx`
- Modify: `mobile/app/(tabs)/(home)/products/[id].tsx`

**Interfaces:**
- Consumes: Task 2(`useAuthStore`), Task 3(`apiFetch`)
- Produces:
  - `toggleFavorite(productId: number): Promise<void>`
  - `useFavorite(productId: number)` → `{ toggle: () => void; isPending: boolean }`
  - `<FavoriteButton product={ProductDetailItem} />`

- [ ] **Step 1: 찜 API 작성**

Create `mobile/lib/favorites.ts`:

```ts
import { apiFetch } from '@/lib/auth/api';

/**
 * 찜을 켜고 끈다. 켜는 것과 끄는 것이 **같은 주소**다(웹 GraphQL 리졸버에서 확인).
 * 그래서 지금 상태를 서버에 보내지 않고, 그냥 한 번 부르면 뒤집힌다.
 */
export async function toggleFavorite(productId: number): Promise<void> {
  const res = await apiFetch(`/products/${productId}/favorite`, { method: 'POST' });

  if (!res.ok) {
    throw new Error(`찜에 실패했어요 (HTTP ${res.status})`);
  }
}
```

- [ ] **Step 2: 찜 훅 작성**

Create `mobile/hooks/use-favorite.ts`:

```ts
import type { Product, ProductDetailItem, ProductResponse } from '@cuddle/shared';
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { useAuthStore } from '@/lib/auth/store';
import { toggleFavorite } from '@/lib/favorites';

// 찜 토글.
//
// 웹(src/hooks/useFavorite.ts)은 하트 상태를 useState로 따로 들고 있어서,
// 서버 값이 바뀔 때마다 useEffect로 맞춰주는 코드가 붙어 있다.
// 앱은 캐시를 직접 뒤집는다 — 상세와 홈 목록의 하트가 한 번에 같이 맞춰져서,
// 상세에서 찜하고 뒤로 나갔을 때 목록 하트가 어긋나지 않는다.

type ProductsPage = ProductResponse['data'];

export function useFavorite(productId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  /** 상세 캐시와 목록 캐시의 하트·찜 수를 같은 값으로 맞춘다. */
  const patchCaches = (next: boolean) => {
    const delta = next ? 1 : -1;

    queryClient.setQueryData<ProductDetailItem>(['product', productId], (old) =>
      old ? { ...old, isFavorite: next, favoriteCount: old.favoriteCount + delta } : old
    );

    queryClient.setQueryData<InfiniteData<ProductsPage>>(['products'], (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              content: page.content.map((item: Product) =>
                item.id === productId
                  ? { ...item, isFavorite: next, favoriteCount: item.favoriteCount + delta }
                  : item
              ),
            })),
          }
        : old
    );
  };

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(productId),

    onMutate: async () => {
      // 진행 중인 재조회가 우리가 뒤집은 값을 덮어쓰지 않게 멈춘다.
      await queryClient.cancelQueries({ queryKey: ['product', productId] });

      const before = Boolean(
        queryClient.getQueryData<ProductDetailItem>(['product', productId])?.isFavorite
      );
      patchCaches(!before);

      // 실패하면 여기로 되돌린다.
      return { before };
    },

    onError: (_error, _variables, context) => {
      if (context) patchCaches(context.before);
      Alert.alert('찜에 실패했어요', '잠시 후 다시 시도해주세요.');
    },

    onSettled: () => {
      // 성공이든 실패든 서버 값으로 다시 맞춘다.
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggle = () => {
    if (mutation.isPending) return;

    // 게스트면 로그인부터. 로그인에 성공하면 화면이 닫히면서 상세가 다시 조회돼
    // 하트가 채워진다(login-form.tsx의 무효화).
    if (useAuthStore.getState().status !== 'authed') {
      router.push('/login');
      return;
    }

    mutation.mutate();
  };

  return { toggle, isPending: mutation.isPending };
}
```

- [ ] **Step 3: 찜 버튼 작성**

Create `mobile/components/product-detail/favorite-button.tsx`:

```tsx
import { Pressable, StyleSheet, Text } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorite } from '@/hooks/use-favorite';

// 상세의 찜 버튼. 판매자 카드 아래 본문 인라인 자리(설계 §8.5).
//
// 하단 고정 바로 만들지 않는 이유: 지금은 버튼이 하나뿐이라 바가 될 이유가 없고,
// 채팅 버튼이 들어오는 바퀴에 어차피 다시 짜게 된다. 그때 승격시킨다.

interface Props {
  productId: number;
  /** 서버가 준 현재 찜 여부. 비로그인 조회에서는 null로 온다. */
  isFavorite: boolean | null;
}

export function FavoriteButton({ productId, isFavorite }: Props) {
  const { toggle, isPending } = useFavorite(productId);
  const active = isFavorite === true;

  return (
    <Pressable
      onPress={toggle}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? '찜 취소' : '찜하기'}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.pressed,
      ]}
    >
      <IconSymbol
        name={active ? 'heart.fill' : 'heart'}
        size={22}
        color={active ? '#FC8181' : '#6B7280'}
      />
      <Text style={[styles.label, active && styles.labelActive]}>
        {active ? '찜한 상품' : '찜하기'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  buttonActive: {
    borderColor: '#FC8181',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  labelActive: {
    color: '#FC8181',
  },
  pressed: {
    opacity: 0.7,
  },
});
```

- [ ] **Step 4: 상세 화면에 버튼 넣기**

Modify `mobile/app/(tabs)/(home)/products/[id].tsx`.

import 추가 (`DetailHeader` import 아래):

```tsx
import { FavoriteButton } from '@/components/product-detail/favorite-button';
```

판매자 카드 섹션과 그 아래 구분선 사이에 찜 버튼 섹션을 끼운다:

```diff
         <View style={styles.section}>
           {isPlaceholderData ? <View style={styles.bar} /> : <SellerCard seller={data.sellerInfo} />}
         </View>

+        {/* 밑그림 상태에서는 아직 isFavorite을 모른다. 버튼을 그리면 하트가
+            빈 채로 보였다가 갑자기 채워져 깜빡인다. 실제 응답이 온 뒤에만 그린다. */}
+        {isPlaceholderData ? null : (
+          <View style={styles.section}>
+            <FavoriteButton productId={data.id} isFavorite={data.isFavorite} />
+          </View>
+        )}
+
         <View style={styles.divider} />
```

- [ ] **Step 5: 타입체크 + 린트 + 전체 테스트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

Expected: 오류·경고 없음 / 38 tests 통과

- [ ] **Step 6: 실기기 확인**

- **로그아웃 상태**에서 상세 열고 「찜하기」 → 로그인 화면이 뜨는지
- 로그인하면 화면이 닫히면서 **하트가 채워지는지** (`isFavorite`이 채워져 다시 그려짐)
- 「찜한 상품」 상태에서 다시 누르면 풀리는지, 찜 수가 ±1 되는지
- **뒤로 나가서 홈 목록의 하트도 같이 바뀌어 있는지** ← 캐시 방식의 핵심
- 비행기 모드로 바꾸고 누르면 → 하트가 되돌아오고 "찜에 실패했어요" 안내가 뜨는지

- [ ] **Step 7: 커밋**

```bash
git add mobile/lib/favorites.ts mobile/hooks/use-favorite.ts mobile/components/product-detail/favorite-button.tsx mobile/app/\(tabs\)/\(home\)/products/\[id\].tsx
git commit -m "feat(mobile): 상품 상세 찜 버튼 (#784)"
```

---

## Task 11: 웹 — 로그인 문구 제거 + 마이페이지 「계정」 카드

**Files:**
- Modify: `src/features/login/Login.tsx`
- Modify: `src/features/my-page/MyPage.tsx`

**Interfaces:**
- Consumes: 웹의 기존 `useLogout` · `WithdrawModal` (새로 만들지 않는다)
- Produces: 없음 (UI 변경)

- [ ] **Step 1: 로그인 화면 모바일 문구 제거**

Modify `src/features/login/Login.tsx` — 모바일 전용 헤드라인을 지운다:

```diff
             {/* 데스크탑: 기존 타이틀 + 설명 그대로 */}
             <div className="hidden md:block">
               <TitleSection
                 title="우리 아이를 위한 믿음직한 선택"
                 desc="로그인하고 반려동물 이웃과의 특별한 일상을 시작해보세요"
               />
             </div>
-            {/* 모바일: 두 줄 헤드라인만 (설명 문구 숨김) */}
-            <h1 className="heading-h3 text-center md:hidden">
-              우리 아이를 위한
-              <br />
-              믿음직한 선택
-            </h1>
             <div className="md:bg-surface md:border-outline-variant/10 flex h-full min-w-full flex-col items-center gap-9 px-10 py-7 md:h-auto md:min-w-100 md:rounded-3xl md:border md:shadow-2xl">
```

데스크탑 `TitleSection`은 **건드리지 않는다.**

- [ ] **Step 2: 마이페이지에 「계정」 카드 추가**

Modify `src/features/my-page/MyPage.tsx`.

**(1)** 33번째 줄의 `lucide-react` import에 아이콘 두 개를 더한다:

```diff
-import { ArrowLeft, Tag, Handbag, ChevronRight, Heart, MessageSquareText, UserX, Headphones } from 'lucide-react'
+import { ArrowLeft, Tag, Handbag, ChevronRight, Heart, MessageSquareText, UserX, Headphones, LogOut, UserMinus } from 'lucide-react'
```

**(2)** `useLogout` import를 추가한다 (이 파일에는 아직 없다 — 확인함):

```tsx
import { useLogout } from '@/hooks/useLogout'
```

**(3)** 컴포넌트 본문에서 훅을 부른다 (46번째 줄 `const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)` 아래):

```tsx
const { openLogoutConfirm } = useLogout()
```

**(4)** 모바일 전용 섹션(`aria-label="마이페이지 모바일 콘텐츠"`)의 **「고객지원」 카드 바로 아래**(그 카드를 닫는 `</div>` 다음, `</section>` 앞)에 카드를 하나 더 넣는다:

```tsx
<div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
  <h2 className="text-base font-bold text-[#1c1b1b]">계정</h2>
  <div className="flex flex-col">
    <button
      type="button"
      onClick={openLogoutConfirm}
      className="text-on-surface flex cursor-pointer items-center gap-3 py-3"
    >
      <LogOut size={20} strokeWidth={1.5} />
      <span className="flex-1 text-left text-base">로그아웃</span>
      <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
    </button>
    <button
      type="button"
      onClick={() => setIsWithdrawModalOpen(true)}
      className="text-danger-500 flex cursor-pointer items-center gap-3 py-3"
    >
      <UserMinus size={20} strokeWidth={1.5} />
      <span className="flex-1 text-left text-base">탈퇴하기</span>
      <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
    </button>
  </div>
</div>
```

**새 API도 새 모달도 만들지 않는다.** `openLogoutConfirm`은 기존 로그아웃 확인 모달을 열고, `setIsWithdrawModalOpen(true)`는 이 파일 아래쪽에 이미 렌더돼 있는 `<WithdrawModal>`을 연다.

- [ ] **Step 3: 타입체크 + 린트**

```bash
npx tsc --noEmit && pnpm lint
```

Expected: 오류·경고 없음

- [ ] **Step 4: 웹 손 확인**

```bash
pnpm dev
```

브라우저 폭을 768px 미만으로 줄이고:
- `/auth/login` → "우리 아이를 위한 / 믿음직한 선택" 문구가 **안 보이는지**
- 폭을 다시 넓히면 데스크탑 타이틀은 **그대로 보이는지**
- 로그인 후 `/mypage` → 「고객지원」 아래에 「계정」 카드가 있는지
- 「로그아웃」 → 기존 확인 모달이 뜨는지
- 「탈퇴하기」 → 기존 탈퇴 모달(사유 드롭다운 · 동의 체크)이 뜨는지 — **제출은 하지 말 것**

- [ ] **Step 5: 커밋**

```bash
git add src/features/login/Login.tsx src/features/my-page/MyPage.tsx
git commit -m "feat(web): 모바일 로그인 문구 제거 + 마이페이지 계정 카드 (#784)"
```

---

## 마무리 검증

모든 Task가 끝난 뒤 한 번에 확인한다.

- [ ] **전체 게이트**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
cd .. && npx tsc --noEmit && pnpm lint
```

Expected: 앱 타입 오류 0 · 린트 경고 0 · 38 tests 통과 / 웹 타입 오류 0 · 린트 경고 0

- [ ] **실기기 손 검증 7단계** (설계 §10)

1. 게스트로 「마이」 탭 → 로그인 화면이 뜨고, **취소하면 원래 보던 탭에 남는다**
2. 틀린 비번 → 오류 문구 / 맞는 비번 → 마이페이지에 닉네임
3. 상세 「찜하기」 → 즉시 채워지고 찜 수 +1 → **뒤로 나가서 목록 하트도 채워져 있는지**
4. 비로그인 상태에서 「찜하기」 → 로그인 → **닫히면서 하트가 채워지는지**
5. **앱 완전 종료 후 재실행** → 로그인 유지
6. 로그아웃 → 게스트 복귀 → 「마이」가 다시 로그인 화면으로
7. 웹: 폭 줄여서 → 로그인 문구 사라짐 / 마이페이지 「계정」 카드에서 두 모달이 뜨는지

- [ ] **401 재현 확인 (마커 검증)**

만료를 기다릴 수 없으니 토큰을 일부러 망가뜨려 확인한다.

`mobile/app/(tabs)/(my)/index.tsx`의 「계정」 카드에 임시로 한 줄을 넣는다:

```tsx
<SectionRow
  label="[개발용] 토큰 망가뜨리기"
  onPress={() => {
    useAuthStore.getState().setAccessToken('broken-token');
  }}
/>
```

누른 뒤 「마이」 탭을 다시 열면(= `GET /profile/me` 재요청) `apiFetch`가 401을 받아 갱신하고 프로필이 정상으로 뜨는 게 정답이다. **확인 후 이 줄을 반드시 지운다.**

- [ ] **임시 코드 제거 확인**

```bash
grep -rn "개발용\|broken-token" mobile/app mobile/components mobile/lib
```

Expected: 출력 없음

- [ ] **PR 생성**

`/commit-push` 스킬을 쓰거나 직접 만든다. **base는 `develop`** 이고, 본문은 저장소 템플릿(`📌 개요 / 🔧 작업 내용 / 📎 관련 이슈 / 📸 스크린샷 / 💬 리뷰어 참고`)을 따른다. 관련 이슈에 `Close #784`를 넣는다.

---

## 이 계획이 끝나면 (다음 바퀴 준비)

- 「내 상품 관리」·「찜한 상품」 메뉴를 마이페이지에 추가 + 목록 화면 2개 (`(my)` 스택에 붙는다)
- 그다음: 신고 → 채팅(이때 찜 버튼을 하단 고정 바로 승격) → 소셜 로그인
