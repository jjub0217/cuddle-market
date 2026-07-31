# 앱 헤더 + 알림 목록 구현 계획 (#806)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에 헤더를 만들어 알림으로 가는 길을 내고 알림 목록 화면을 만든다. 같이 드러난 웹 오버레이 버그와 갈린 모바일 헤더도 고친다.

**Architecture:** 헤더 조각 하나를 홈·마이가 함께 쓰고(왼쪽만 다름), 알림 API·경로 규칙을 `mobile/lib/notifications.ts` 한 곳에 모아 헤더와 목록 화면이 공유한다. 웹은 오버레이를 `<header>` 밖으로 빼고, 두 페이지가 각자 만든 모바일 뒤로가기 헤더를 공용 조각으로 합친다.

**Tech Stack:** Expo SDK 54 · React Native · TypeScript · TanStack Query · Jest / Next.js 웹

**설계 스펙:** `docs/superpowers/specs/2026-07-31-app-header-notifications-design.md`

---

## Global Constraints

- **Expo SDK 54 고정.** 새 네이티브 모듈을 넣지 않는다 — 실기기 확인을 Expo Go로 한다
- `expo-web-browser`는 **Expo SDK에 들어 있어** 예외다 (새 네이티브 모듈이 아니다)
- **알림 제목은 서버 `title`이 아니라 타입별 상수를 쓴다** — 안 그러면 같은 알림이 웹과 앱에서 다른 문구가 된다
- 알림 목록 페이지 크기는 **`size=10`** (웹과 같게)
- 인증코드 만료 같은 서버 값은 **앱이 새로 정하지 않는다**
- 웹에서 `max-w-3xl` 같은 티셔츠 크기를 쓰면 안 된다 — Tailwind v4가 `--spacing-3xl`(48px)로 풀어 폭이 48px이 된다. 숫자 방식(`max-w-170` = 680px)이나 `max-w-7xl`을 쓴다
- 게이트: 앱 `npx tsc --noEmit && npx expo lint && npx jest` / 웹 `npx tsc --noEmit` + 바뀐 파일 `npx eslint`

---

## 두 갈래로 나뉜다 — tmux 팬 병렬

```
갈래 A · 웹     src/components/header/**
                src/features/product-post/ProductPost.tsx
                src/features/community/components/CommunityPostForm.tsx

갈래 B · 앱     mobile/components/**
                mobile/lib/notifications.ts
                mobile/app/notifications.tsx
                mobile/app/(tabs)/**
                mobile/assets/images/logo.png
```

**파일이 하나도 안 겹친다.** 두 갈래를 동시에 진행해도 충돌이 없다.

**갈래 안에서는 순서를 지킨다** — 특히 B는 Task 5(API)가 Task 6·7의 재료다.

---

## File Structure

### 갈래 A · 웹

| 파일 | 책임 |
|---|---|
| `src/components/header/Header.tsx` | 알림 오버레이를 `<header>` 밖에서 그린다. 열림 상태를 들고 있는다 |
| `src/components/header/components/UserControls.tsx` | 벨은 「열어달라」는 신호만 위로 보낸다 |
| `src/components/header/MobileBackHeader.tsx` | **신설.** 모바일 폭 뒤로가기 헤더 (흰 배경 · 왼쪽 정렬 · 아래 선) |
| `src/features/product-post/ProductPost.tsx` | 손으로 만든 헤더 제거 → 조각 사용 |
| `src/features/community/components/CommunityPostForm.tsx` | 위와 같음 |

### 갈래 B · 앱

| 파일 | 책임 |
|---|---|
| `mobile/lib/notifications.ts` | API 4개 · 타입 · 문구 상수 · 이동 경로 규칙 |
| `mobile/lib/notifications.test.ts` | 위 테스트 |
| `mobile/components/ui/icon-symbol.tsx` | 알림 아이콘 8개 매핑 추가 |
| `mobile/components/ui/app-header.tsx` | **신설.** 홈·마이 공용 헤더 + 알림 벨 |
| `mobile/components/notifications/notification-row.tsx` | **신설.** 목록 항목 하나 |
| `mobile/app/notifications.tsx` | **신설.** 알림 목록 화면 |
| `mobile/app/(tabs)/(home)/index.tsx` | 헤더 붙이기 |
| `mobile/app/(tabs)/(my)/index.tsx` | 헤더 붙이기 |
| `mobile/app/_layout.tsx` | `notifications` 화면 등록 (헤더 숨김) |

### 왜 이렇게 나누나

`notifications.ts`가 **API·문구·경로 규칙을 한 곳에 모은다.** 헤더(안 읽은 수)와 목록 화면(전부)이 같은 재료를 쓰므로 두 군데에 흩어지면 어긋난다. 그리고 순수 함수라 테스트가 쉽다.

---

# 갈래 A · 웹

## Task 1: 알림 오버레이를 헤더 밖으로 (#804)

**Files:**
- Modify: `src/components/header/components/UserControls.tsx`
- Modify: `src/components/header/Header.tsx`

**Interfaces:**
- Produces: `UserControlsProps.onOpenMobileNotifications: () => void`

**왜 옮기나** — 두 증상이 한 뿌리다.

```
① 크기   <header>에 backdrop-blur-sm이 있으면 그 안의 fixed 자식은
         화면 전체가 아니라 헤더 상자(48px)를 기준으로 잡힌다
② 순서   <header class="z-30">가 쌓임 맥락을 만들어, 그 안의 z-[100]은
         바깥에서 z-30으로 취급된다. FAB도 z-30이고 DOM에서 뒤라 이긴다
```

- [ ] **Step 1: 지금 상태를 눈으로 확인한다**

```bash
pnpm dev
```

`localhost:3000` → 개발자도구로 모바일 폭 → 로그인 → **커뮤니티 탭** → 헤더 알림 아이콘.

기대: 알림 헤더 줄만 보이고 목록이 없다. 뒤의 커뮤니티가 비친다.

> 홈 상단에서 열면 정상이다. 홈에서 스크롤을 내린 뒤 열면 다시 깨진다. 셋 다 확인해 둔다.

- [ ] **Step 2: `UserControls`에서 오버레이를 떼어낸다**

`src/components/header/components/UserControls.tsx`

import 줄을 지운다.

```diff
- import MobileNotificationsOverlay from './MobileNotificationsOverlay'
```

props에 콜백을 더한다.

```diff
 interface UserControlsProps {
   isSideOpen: boolean
   setIsSideOpen: React.Dispatch<React.SetStateAction<boolean>>
   hideMenuButton?: boolean
+  /**
+   * 모바일 알림 오버레이를 연다.
+   *
+   * 오버레이를 여기서 그리지 않고 Header가 그리는 이유:
+   * 헤더는 솔리드 상태일 때 backdrop-blur-sm을 쓴다. backdrop-filter가 걸린 요소는
+   * 그 안의 position:fixed 자식에게 「기준 상자」가 되어(transform·filter와 같은 규칙),
+   * fixed inset-0이 화면 전체가 아니라 헤더 높이로 잡힌다.
+   * 게다가 헤더의 z-30이 쌓임 맥락을 만들어 오버레이의 z-[100]이 바깥에서
+   * z-30으로 취급된다 — 같은 z-30인 FAB이 DOM에서 뒤라 위에 그려진다.
+   * 두 증상 모두 헤더 밖으로 빼면 사라진다(#804).
+   */
+  onOpenMobileNotifications: () => void
 }
```

함수 시그니처를 바꾼다.

```diff
-export default function UserControls({ isSideOpen, setIsSideOpen, hideMenuButton = false }: UserControlsProps) {
+export default function UserControls({
+  isSideOpen,
+  setIsSideOpen,
+  hideMenuButton = false,
+  onOpenMobileNotifications,
+}: UserControlsProps) {
```

내부 상태를 지우고 콜백을 부른다.

```diff
-  const [isMobileNotificationOpen, setIsMobileNotificationOpen] = useState(false)
```

```diff
   const handleBellToggle = () => {
     if (isMobile) {
-      setIsMobileNotificationOpen(true)
+      onOpenMobileNotifications()
     } else {
       setIsNotificationOpen((prev) => !prev)
     }
   }
```

맨 아래 오버레이 렌더를 지운다.

```diff
       </div>
-      {hasHydrated && isLogin() ? (
-        <MobileNotificationsOverlay
-          isOpen={isMobileNotificationOpen}
-          onClose={() => setIsMobileNotificationOpen(false)}
-        />
-      ) : null}
     </>
```

- [ ] **Step 3: `Header`가 오버레이를 그리게 한다**

`src/components/header/Header.tsx`

import를 더한다.

```diff
 import MobileNavigation from '@/components/header/components/MobileNavigation'
+import MobileNotificationsOverlay from '@/components/header/components/MobileNotificationsOverlay'
```

상태를 더한다. `isSearchOpen`·`isSideOpen`이 선언된 자리 옆에 둔다.

```diff
   const [isSideOpen, setIsSideOpen] = useState(false)
+  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
```

`UserControls`에 콜백을 넘긴다.

```diff
-                <UserControls isSideOpen={isSideOpen} setIsSideOpen={setIsSideOpen} hideMenuButton={hideMenuButton} />
+                <UserControls
+                  isSideOpen={isSideOpen}
+                  setIsSideOpen={setIsSideOpen}
+                  hideMenuButton={hideMenuButton}
+                  onOpenMobileNotifications={() => setIsNotificationsOpen(true)}
+                />
```

`</header>` 뒤, 검색·내비 오버레이 옆에 그린다.

```diff
       {!hideSearchBar ? (
         <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
       ) : null}
       <MobileNavigation isOpen={isSideOpen} onClose={() => setIsSideOpen(false)} />
+      {/* ⚠️ 전체화면 오버레이는 반드시 </header> 밖에 둔다.
+          헤더에는 backdrop-blur-sm(기준 상자를 만든다)과 z-30(쌓임 맥락을 만든다)이
+          걸려 있어서, 안에 두면 fixed inset-0이 헤더 높이로 잘리고 z-[100]도 무시된다(#804). */}
+      <MobileNotificationsOverlay
+        isOpen={isNotificationsOpen}
+        onClose={() => setIsNotificationsOpen(false)}
+      />
     </>
```

> `hasHydrated && isLogin()` 조건은 뺀다. 오버레이 안의 조회가 이미 `enabled: !!user && isOpen`으로 막고 있고, 비로그인 상태에서는 벨 자체가 안 보여 열릴 일이 없다.

- [ ] **Step 4: 타입·린트를 확인한다**

```bash
npx tsc --noEmit
npx eslint src/components/header/Header.tsx src/components/header/components/UserControls.tsx
```

기대: 오류 0건.

- [ ] **Step 5: 네 자리에서 눈으로 확인한다**

```
□ 홈 상단          알림 목록이 보인다
□ 홈 스크롤 후      알림 목록이 보인다   ← 이게 깨져 있던 것
□ 커뮤니티          알림 목록이 보인다   ← 이게 깨져 있던 것
□ 상품 상세         알림 목록이 보인다
□ 「상품 등록」 버튼이 오버레이에 가려진다
□ X를 누르면 닫히고 원래 화면으로 돌아온다
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/header/Header.tsx src/components/header/components/UserControls.tsx
git commit -m "fix(web): 모바일 알림 오버레이를 헤더 밖으로 (#804)"
```

---

## Task 2: 모바일 뒤로가기 헤더 공용 조각

**Files:**
- Create: `src/components/header/MobileBackHeader.tsx`
- Modify: `src/features/product-post/ProductPost.tsx:103-113`
- Modify: `src/features/community/components/CommunityPostForm.tsx:204-214`

**Interfaces:**
- Produces: `<MobileBackHeader title={string} onBack?={() => void} className?={string} />`

**무엇이 문제였나** — 같은 역할을 두 곳이 각자 손으로 만들어 값이 갈렸다.

```
상품 등록        bg-primary-200 (베이지) · justify-between (제목이 가운데로 밀림) · 화살표 흰색
커뮤니티 글작성   bg-white + 아래 선 · gap-3 (왼쪽 정렬) · 화살표 기본색
```

**커뮤니티 쪽에 맞춘다.** 본문이 흰색이라 베이지가 뚝 끊겨 보였다.

- [ ] **Step 1: 공용 조각을 만든다**

`src/components/header/MobileBackHeader.tsx`

```tsx
'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

// 모바일 폭에서만 보이는 뒤로가기 헤더.
//
// 왜 조각으로 빼나: 상품 등록과 커뮤니티 글 작성이 같은 역할을 각자 손으로 만들어
// 색(베이지 vs 흰색)과 정렬(가운데 vs 왼쪽)이 갈려 있었다. 페이지가 늘면 또 갈린다.
//
// 데스크탑에서는 전역 헤더가 있으므로 md 이상에서 숨긴다.

interface MobileBackHeaderProps {
  title: string
  /** 안 주면 브라우저 뒤로가기 */
  onBack?: () => void
  className?: string
}

export default function MobileBackHeader({ title, onBack, className }: MobileBackHeaderProps) {
  const router = useRouter()

  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={onBack ?? (() => router.back())}
        aria-label="뒤로가기"
        className="cursor-pointer"
      >
        <ArrowLeft size={20} />
      </button>
      <span className="text-base font-semibold text-gray-900">{title}</span>
    </div>
  )
}
```

- [ ] **Step 2: 커뮤니티 글 작성이 조각을 쓰게 한다**

`src/features/community/components/CommunityPostForm.tsx`

지금 손으로 만든 블록(204~214행 근처, `sticky top-0 flex items-center gap-3 border-b ... md:hidden`으로 시작하는 `<div>`)을 통째로 지우고 이것으로 바꾼다.

```tsx
<MobileBackHeader title={isEditMode ? '게시글 수정' : '게시글 작성'} />
```

import를 더한다.

```tsx
import MobileBackHeader from '@/components/header/MobileBackHeader'
```

`ArrowLeft`를 더 이상 안 쓰면 import에서 뺀다. `Info`는 다른 데서 쓰므로 남긴다.

- [ ] **Step 3: 상품 등록이 조각을 쓰게 한다**

`src/features/product-post/ProductPost.tsx`

손으로 만든 블록(103~113행 근처, `bg-primary-200 sticky top-0 ... md:hidden`)을 지우고 바꾼다.

```tsx
<MobileBackHeader title={headerTitle} />
```

import를 더하고, `ArrowLeft`를 더 이상 안 쓰면 뺀다.

> `headerTitle`은 이미 이 파일에 있는 값이다(등록/수정에 따라 달라진다).

- [ ] **Step 4: 타입·린트를 확인한다**

```bash
npx tsc --noEmit
npx eslint src/components/header/MobileBackHeader.tsx src/features/product-post/ProductPost.tsx src/features/community/components/CommunityPostForm.tsx
```

- [ ] **Step 5: 눈으로 확인한다**

```bash
pnpm dev
```

모바일 폭으로 좁혀서:

```
□ /product-post          흰 배경 · 왼쪽 정렬 · 아래 선
□ /community-post        위와 똑같이 보인다
□ 두 화면의 헤더 높이·글자 크기가 같다
□ 뒤로가기가 동작한다
□ 데스크탑 폭에서는 둘 다 안 보인다 (전역 헤더만)
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/header/MobileBackHeader.tsx src/features/product-post/ProductPost.tsx src/features/community/components/CommunityPostForm.tsx
git commit -m "refactor(web): 모바일 뒤로가기 헤더를 공용 조각으로 (#806)"
```

---

## Task 3: 웹 갈래 마무리 게이트

- [ ] **Step 1: 전체 게이트**

```bash
npx tsc --noEmit
npx eslint src/components/header/ src/features/product-post/ProductPost.tsx src/features/community/components/CommunityPostForm.tsx
pnpm build
```

기대: 타입·린트 오류 0건, 빌드 성공.

> `pnpm lint`(전체)는 아직 exit 1이 정상이다 — #788의 잔여 10건. 바뀐 파일만 확인한다.

---

# 갈래 B · 앱

## Task 4: 로고 자산 옮기기

**Files:**
- Create: `mobile/assets/images/logo.png`

- [ ] **Step 1: 웹 로고를 앱으로 복사한다**

앱에는 로고 컴포넌트도 자산도 없다. 웹이 쓰는 가로형 로고를 그대로 쓴다.

```bash
cp public/images/CuddleMarketLogoImage_v2.png mobile/assets/images/logo.png
```

> `.webp`가 아니라 `.png`를 쓴다. React Native의 `Image`는 안드로이드에서 webp를 지원하지만 iOS는 버전에 따라 갈린다. 로고 하나 때문에 위험을 지지 않는다.

- [ ] **Step 2: 파일이 들어갔는지 본다**

```bash
ls -la mobile/assets/images/logo.png
```

기대: 파일이 있고 크기가 0이 아니다.

- [ ] **Step 3: 커밋**

```bash
git add mobile/assets/images/logo.png
git commit -m "chore(mobile): 웹 로고 자산을 앱으로 (#806)"
```

---

## Task 5: 알림 API · 문구 · 경로 규칙

**Files:**
- Create: `mobile/lib/notifications.ts`
- Test: `mobile/lib/notifications.test.ts`

**Interfaces:**
- Consumes: `apiFetch` from `mobile/lib/auth/api.ts`
- Produces:
  - `type NotificationType` — 8종 문자열 유니온
  - `interface NotificationItem { notificationId: number; notificationType: NotificationType; title: string; content: string; relatedEntityType: string | null; relatedEntityId: number | null; isRead: boolean; createdAt: string }`
  - `NOTIFICATION_MESSAGES: Record<NotificationType, string>`
  - `NOTIFICATION_ICONS: Record<NotificationType, IconSymbolName>`
  - `fetchNotifications(page: number): Promise<{ content: NotificationItem[]; hasNext: boolean }>`
  - `fetchUnreadCount(): Promise<number>`
  - `markAsRead(id: number): Promise<void>`
  - `markAllAsRead(): Promise<void>`
  - `resolveTarget(item: NotificationItem): { kind: 'app'; path: string } | { kind: 'web'; path: string }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`mobile/lib/notifications.test.ts`

```ts
import {
  NOTIFICATION_MESSAGES,
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
  resolveTarget,
  type NotificationItem,
} from './notifications';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 시험용 알림 하나. 필요한 필드만 바꿔 쓴다. */
function item(over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    notificationId: 1,
    notificationType: 'PRODUCT_FAVORITE_STATUS_CHANGED',
    title: '서버가 준 제목',
    content: "'개구리 사료' 상품의 거래 상태가 바뀌었습니다.",
    relatedEntityType: 'PRODUCT',
    relatedEntityId: 42,
    isRead: false,
    createdAt: '2026-07-31T10:00:00',
    ...over,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
});

describe('fetchNotifications', () => {
  it('page와 size=10으로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { content: [], hasNext: false } }));

    await fetchNotifications(2);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/notifications?page=2&size=10',
      expect.anything()
    );
  });

  it('content와 hasNext를 돌려준다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { content: [item()], hasNext: true } }));

    const page = await fetchNotifications(0);

    expect(page.content).toHaveLength(1);
    expect(page.hasNext).toBe(true);
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchNotifications(0)).rejects.toThrow();
  });
});

describe('fetchUnreadCount', () => {
  it('개수를 숫자로 돌려준다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { unreadCount: 3 } }));
    await expect(fetchUnreadCount()).resolves.toBe(3);
  });

  it('실패하면 0으로 본다 — 헤더의 점 하나 때문에 화면을 깨뜨리지 않는다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUnreadCount()).resolves.toBe(0);
  });
});

describe('markAsRead / markAllAsRead', () => {
  it('PATCH로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, {}));
    await markAsRead(7);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/notifications/7/read',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('전체 읽음도 PATCH로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, {}));
    await markAllAsRead();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/notifications/read-all',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

describe('resolveTarget', () => {
  it('상품은 앱 화면으로', () => {
    expect(resolveTarget(item({ relatedEntityType: 'PRODUCT', relatedEntityId: 42 }))).toEqual({
      kind: 'app',
      path: '/products/42',
    });
  });

  it('관리자 제재는 앱 마이로', () => {
    expect(
      resolveTarget(
        item({ notificationType: 'ADMIN_SANCTION', relatedEntityType: null, relatedEntityId: null })
      )
    ).toEqual({ kind: 'app', path: '/(tabs)/(my)' });
  });

  it('채팅방은 앱에 화면이 없으니 웹으로', () => {
    expect(resolveTarget(item({ relatedEntityType: 'CHAT_ROOM', relatedEntityId: 9 }))).toEqual({
      kind: 'web',
      path: '/chat/9',
    });
  });

  it('커뮤니티 글도 웹으로', () => {
    expect(resolveTarget(item({ relatedEntityType: 'POST', relatedEntityId: 5 }))).toEqual({
      kind: 'web',
      path: '/community/5',
    });
  });

  it('게시글 삭제 알림은 커뮤니티 목록(웹)으로', () => {
    expect(
      resolveTarget(
        item({ notificationType: 'POST_DELETED', relatedEntityType: null, relatedEntityId: null })
      )
    ).toEqual({ kind: 'web', path: '/community' });
  });

  it('아무 데도 안 걸리면 앱 홈으로', () => {
    expect(
      resolveTarget(
        item({
          notificationType: 'PRODUCT_FAVORITE_PRICE_CHANGED',
          relatedEntityType: null,
          relatedEntityId: null,
        })
      )
    ).toEqual({ kind: 'app', path: '/(tabs)/(home)' });
  });
});

describe('NOTIFICATION_MESSAGES', () => {
  it('여덟 종류가 모두 있다 — 웹과 같은 문구를 쓴다', () => {
    expect(Object.keys(NOTIFICATION_MESSAGES)).toHaveLength(8);
    expect(NOTIFICATION_MESSAGES.PRODUCT_FAVORITE_STATUS_CHANGED).toBe(
      '찜한 상품의 거래 상태가 변경되었습니다'
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 본다**

```bash
cd mobile && npx jest lib/notifications.test.ts
```

기대: `Cannot find module './notifications'`로 실패.

- [ ] **Step 3: 구현한다**

`mobile/lib/notifications.ts`

```ts
import { apiFetch } from './auth/api';

// 알림 API와 규칙을 한 곳에 모은다.
// 헤더(안 읽은 수)와 목록 화면(전부)이 같은 재료를 쓰므로, 두 군데에 흩어지면 어긋난다.
//
// 백엔드는 REST 4개가 이미 완비돼 있다(6바퀴 조사). 웹은 GraphQL을 거치지만
// 앱은 REST를 직접 부른다.

export type NotificationType =
  | 'CHAT_NEW_ROOM'
  | 'CHAT_NEW_MESSAGE'
  | 'PRODUCT_FAVORITE_STATUS_CHANGED'
  | 'PRODUCT_FAVORITE_PRICE_CHANGED'
  | 'ADMIN_SANCTION'
  | 'POST_DELETED'
  | 'COMMENT_REPLY'
  | 'POST_COMMENT';

export interface NotificationItem {
  notificationId: number;
  notificationType: NotificationType;
  /** 서버가 주지만 화면에는 안 쓴다 — 아래 NOTIFICATION_MESSAGES를 쓴다 */
  title: string;
  content: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * 화면에 보일 제목.
 *
 * 서버가 주는 title을 안 쓰는 이유: 웹도 이 상수를 쓴다(constants.ts의
 * NOTIFICATION_MESSAGES). 서버 값을 그대로 쓰면 같은 알림이 웹과 앱에서
 * 다른 문구로 보인다. 본문(content)은 상품 이름 같은 게 들어 있어 그대로 쓴다.
 */
export const NOTIFICATION_MESSAGES: Record<NotificationType, string> = {
  CHAT_NEW_ROOM: '새로운 채팅이 생성되었습니다',
  CHAT_NEW_MESSAGE: '새로운 메시지가 도착했습니다',
  PRODUCT_FAVORITE_STATUS_CHANGED: '찜한 상품의 거래 상태가 변경되었습니다',
  PRODUCT_FAVORITE_PRICE_CHANGED: '찜한 상품의 가격이 변동되었습니다',
  ADMIN_SANCTION: '관리자에 의해 제재를 받았습니다',
  POST_DELETED: '작성한 게시글이 삭제되었습니다',
  COMMENT_REPLY: '댓글에 새로운 답글이 달렸습니다',
  POST_COMMENT: '게시글에 새로운 댓글이 달렸습니다',
};

/** 알림 종류별 아이콘. IconSymbol이 아는 이름이어야 한다(Task 6에서 매핑을 더한다). */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  CHAT_NEW_ROOM: 'bell.chat.new',
  CHAT_NEW_MESSAGE: 'bell.chat',
  PRODUCT_FAVORITE_STATUS_CHANGED: 'bell.heart.broken',
  PRODUCT_FAVORITE_PRICE_CHANGED: 'bell.tag',
  ADMIN_SANCTION: 'bell.shield',
  POST_DELETED: 'bell.trash',
  COMMENT_REPLY: 'bell.reply',
  POST_COMMENT: 'bell.comment',
};

interface Page {
  content: NotificationItem[];
  hasNext: boolean;
}

/** 알림 한 페이지. 웹과 같이 열 개씩 가져온다. */
export async function fetchNotifications(page: number): Promise<Page> {
  const res = await apiFetch(`/notifications?page=${page}&size=10`);
  if (!res.ok) throw new Error(`알림을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: Partial<Page> };
  return {
    content: body.data?.content ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

/**
 * 안 읽은 개수.
 *
 * 실패해도 던지지 않는다 — 이 값은 헤더의 점 하나를 켜고 끄는 데만 쓴다.
 * 여기서 던지면 조회 실패가 홈 화면 전체를 오류로 만든다.
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await apiFetch('/notifications/unread-count');
    if (!res.ok) return 0;
    const body = (await res.json()) as { data?: { unreadCount?: number } };
    return body.data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: number): Promise<void> {
  await apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'PATCH' });
}

/**
 * 알림을 눌렀을 때 갈 곳.
 *
 * kind가 'app'이면 앱 화면으로 옮기고, 'web'이면 앱 안 브라우저로 웹 주소를 연다.
 * 채팅(12바퀴)·커뮤니티(9바퀴) 화면이 앱에 아직 없어서 나뉜다. 그 바퀴들이 지나면
 * 여기만 고치면 된다 — 화면 쪽은 안 건드려도 된다.
 *
 * 규칙은 웹 src/lib/utils/getNavigationPath.ts와 같다.
 */
export function resolveTarget(
  item: NotificationItem
): { kind: 'app'; path: string } | { kind: 'web'; path: string } {
  const { relatedEntityType, relatedEntityId, notificationType } = item;

  if (relatedEntityId !== null) {
    if (relatedEntityType === 'PRODUCT') return { kind: 'app', path: `/products/${relatedEntityId}` };
    if (relatedEntityType === 'CHAT_ROOM') return { kind: 'web', path: `/chat/${relatedEntityId}` };
    if (relatedEntityType === 'POST') return { kind: 'web', path: `/community/${relatedEntityId}` };
  }

  if (notificationType === 'ADMIN_SANCTION') return { kind: 'app', path: '/(tabs)/(my)' };
  if (notificationType === 'POST_DELETED') return { kind: 'web', path: '/community' };

  return { kind: 'app', path: '/(tabs)/(home)' };
}
```

- [ ] **Step 4: 테스트가 통과하는지 본다**

```bash
cd mobile && npx jest lib/notifications.test.ts
```

기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/notifications.ts mobile/lib/notifications.test.ts
git commit -m "feat(mobile): 알림 API·문구·경로 규칙 (#806)"
```

---

## Task 6: 알림 아이콘 매핑

**Files:**
- Modify: `mobile/components/ui/icon-symbol.tsx`

**Interfaces:**
- Consumes: Task 5의 `NOTIFICATION_ICONS` 값들
- Produces: `IconSymbolName`에 8개가 더해진다

- [ ] **Step 1: 매핑을 더한다**

`mobile/components/ui/icon-symbol.tsx`의 `MAPPING`에 여덟 줄을 더한다. 값은 MaterialIcons 이름이다.

```diff
 const MAPPING = {
   'house.fill': 'home',
   'paperplane.fill': 'send',
   'chevron.left.forwardslash.chevron.right': 'code',
   'chevron.right': 'chevron-right',
   'chevron.left': 'chevron-left',
   'person.crop.circle': 'person',
   'heart.fill': 'favorite',
+  // 알림 종류별 아이콘(#806). 웹은 Lucide를, 앱은 MaterialIcons를 써서
+  // 모양이 똑같지는 않다 — 같은 뜻의 아이콘을 고른 것이다.
+  // 아이콘 여덟 개를 위해 SVG 라이브러리를 새로 들이지는 않는다.
+  'bell': 'notifications-none',
+  'bell.chat.new': 'add-comment',
+  'bell.chat': 'chat',
+  'bell.heart.broken': 'heart-broken',
+  'bell.tag': 'local-offer',
+  'bell.shield': 'gpp-maybe',
+  'bell.trash': 'delete',
+  'bell.reply': 'reply',
+  'bell.comment': 'comment',
 } as IconMapping;
```

> `'bell'`은 헤더의 알림 버튼이 쓴다. 나머지 여덟은 목록 항목이 쓴다.

- [ ] **Step 2: 타입이 맞는지 본다**

```bash
cd mobile && npx tsc --noEmit
```

기대: 오류 0건. 오류가 나면 MaterialIcons에 그 이름이 없는 것이다 — `heart-broken`·`gpp-maybe`가 후보다. 없으면 각각 `favorite-border`·`report`로 바꾸고, 바꾼 이유를 주석에 적는다.

- [ ] **Step 3: 커밋**

```bash
git add mobile/components/ui/icon-symbol.tsx
git commit -m "feat(mobile): 알림 아이콘 매핑 9개 (#806)"
```

---

## Task 7: 앱 헤더 조각

**Files:**
- Create: `mobile/components/ui/app-header.tsx`

**Interfaces:**
- Consumes: Task 4의 `logo.png`, Task 5의 `fetchUnreadCount`, Task 6의 `'bell'`
- Produces: `<AppHeader left={ReactNode | string} />`

- [ ] **Step 1: 조각을 만든다**

`mobile/components/ui/app-header.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/lib/auth/store';
import { fetchUnreadCount } from '@/lib/notifications';

// 홈·마이가 함께 쓰는 헤더. 왼쪽만 다르고 오른쪽(알림 벨)은 같다.
// 9바퀴에 커뮤니티 탭이 생겨도 이 조각을 그대로 쓴다.
//
// 높이는 로그인·회원가입 화면과 같은 52다. 앱 안에서 헤더 높이가 갈리면 안 된다.

const HEADER_HEIGHT = 52;

interface Props {
  /** 문자열이면 제목으로, 아니면 그대로 그린다(홈은 로고 이미지) */
  left: ReactNode | string;
}

export function AppHeader({ left }: Props) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const isAuthed = status === 'authed';

  // 안 읽은 개수. 화면에 들어올 때마다 다시 조회한다(SSE는 안 쓴다 — 설계 §3).
  // 실패해도 0을 돌려주므로 여기서 오류를 다루지 않는다.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: fetchUnreadCount,
    enabled: isAuthed,
    refetchOnMount: 'always',
  });

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {typeof left === 'string' ? <Text style={styles.title}>{left}</Text> : left}
      </View>

      {/* 비로그인이면 벨을 아예 안 보여준다. 눌러서 로그인으로 보내는 것보다 정직하다. */}
      {isAuthed ? (
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? '알림 (읽지 않은 알림 있음)' : '알림'}
          style={({ pressed }) => (pressed ? styles.bellPressed : undefined)}
        >
          <IconSymbol name="bell" size={26} color="#111827" />
          {unreadCount > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

/** 홈이 쓰는 로고. 눌러도 아무 데도 안 간다 — 이미 홈이다. */
export function HeaderLogo() {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={styles.logo}
      contentFit="contain"
      accessibilityLabel="커들마켓"
    />
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  left: { flexShrink: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  logo: { width: 120, height: 32 },
  bellPressed: { opacity: 0.5 },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    // 웹과 같은 값(--color-danger-500)
    backgroundColor: '#C91D1D',
  },
});
```

- [ ] **Step 2: 타입을 확인한다**

```bash
cd mobile && npx tsc --noEmit
```

`useAuthStore`의 상태는 **확인해 두었다** — `status: 'restoring' | 'authed' | 'guest'`이다(`mobile/lib/auth/store.ts:20`). 그대로 쓰면 된다.

- [ ] **Step 3: 커밋**

```bash
git add mobile/components/ui/app-header.tsx
git commit -m "feat(mobile): 홈·마이 공용 헤더 조각 (#806)"
```

---

## Task 8: 알림 목록 화면

**Files:**
- Create: `mobile/components/notifications/notification-row.tsx`
- Create: `mobile/app/notifications.tsx`
- Modify: `mobile/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 5 전부, Task 6의 아이콘, 기존 `components/list-states.tsx`
- Produces: 경로 `/notifications`

- [ ] **Step 1: 목록 항목 조각을 만든다**

`mobile/components/notifications/notification-row.tsx`

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_MESSAGES,
  type NotificationItem,
} from '@/lib/notifications';

interface Props {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

/** 「2개월 전」 같은 표기. 분·시간·일·개월만 쓴다 — 초 단위는 알림에 의미가 없다. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  return `${Math.floor(days / 30)}개월 전`;
}

export function NotificationRow({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        !item.isRead && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <IconSymbol name={NOTIFICATION_ICONS[item.notificationType]} size={20} color="#825500" />
      </View>

      <View style={styles.body}>
        {/* 서버 title이 아니라 정해진 문구를 쓴다 — 웹과 같아야 한다 */}
        <Text style={styles.title}>{NOTIFICATION_MESSAGES[item.notificationType]}</Text>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>

      {!item.isRead ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  // 안 읽음: 배경 + 점. 웹과 같은 방식이다.
  unread: { backgroundColor: '#FDF6EC' },
  pressed: { opacity: 0.7 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBEFDD',
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  content: { fontSize: 14, color: '#4B5563' },
  time: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2620A',
    marginTop: 6,
  },
});
```

- [ ] **Step 2: 화면을 만든다**

`mobile/app/notifications.tsx`

```tsx
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { NotificationRow } from '@/components/notifications/notification-row';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiBaseUrl } from '@/lib/auth/api';
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  resolveTarget,
  type NotificationItem,
} from '@/lib/notifications';

// 알림 목록. 헤더는 화면이 직접 그린다(login·signup과 같은 이유 —
// native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다).

const HEADER_HEIGHT = 52;

/** 웹 주소. API base에서 /api를 떼면 웹 도메인이 된다. */
function webUrl(path: string): string {
  return `${apiBaseUrl().replace(/\/api$/, '')}${path}`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['notifications'],
      queryFn: ({ pageParam }) => fetchNotifications(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
    });

  const items: NotificationItem[] = data?.pages.flatMap((page) => page.content) ?? [];

  /** 목록과 헤더의 점을 함께 새로 고친다. */
  const refresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
  };

  const handlePress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.notificationId);
      refresh();
    }

    const target = resolveTarget(item);

    if (target.kind === 'app') {
      router.push(target.path as never);
      return;
    }

    // 앱에 아직 그 화면이 없다(채팅 12바퀴 · 커뮤니티 9바퀴).
    // 웹에는 있으므로 앱 안 브라우저로 연다. 다만 웹 세션은 폰 브라우저 쪽에 있어서
    // 앱만 쓴 사람은 로그인 화면을 만난다 — 그래서 미리 알려준다(설계 §5).
    Alert.alert(
      '웹에서 열려요',
      '앱에는 아직 이 화면이 없어 웹으로 보여드립니다. 로그인이 필요할 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '열기', onPress: () => WebBrowser.openBrowserAsync(webUrl(target.path)) },
      ]
    );
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    refresh();
  };

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="알림을 불러오지 못했어요." />;
    if (items.length === 0)
      return (
        <EmptyState
          title="아직 받은 알림이 없어요."
          description="찜한 상품이나 내 글에 소식이 생기면 여기에 보여드릴게요."
        />
      );

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.notificationId)}
        renderItem={({ item }) => <NotificationRow item={item} onPress={handlePress} />}
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>알림</Text>
        <Pressable onPress={handleReadAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.readAll}>모두 읽음</Text>
        </Pressable>
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
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  readAll: { fontSize: 14, color: '#825500' },
  pressed: { opacity: 0.5 },
});
```

- [ ] **Step 3: `expo-web-browser`를 넣는다**

```bash
cd mobile && npx expo install expo-web-browser
```

> `npx expo install`을 쓴다(`pnpm add`가 아니라). SDK 54에 맞는 버전을 골라준다.

- [ ] **Step 4: 화면을 등록한다**

`mobile/app/_layout.tsx`

```diff
           <Stack.Screen name="signup" options={{ headerShown: false }} />
+          {/* 헤더는 화면이 직접 그린다(login과 같은 이유) */}
+          <Stack.Screen name="notifications" options={{ headerShown: false }} />
```

- [ ] **Step 5: 게이트를 돌린다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

기대: 오류 0건, 기존 117개 + 새 테스트가 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add mobile/components/notifications/ mobile/app/notifications.tsx mobile/app/_layout.tsx mobile/package.json
git commit -m "feat(mobile): 알림 목록 화면 (#806)"
```

---

## Task 9: 헤더를 두 탭에 붙이기

**Files:**
- Modify: `mobile/app/(tabs)/(home)/index.tsx`
- Modify: `mobile/app/(tabs)/(my)/index.tsx`

**Interfaces:**
- Consumes: Task 7의 `AppHeader`·`HeaderLogo`

- [ ] **Step 1: 홈에 붙인다**

`mobile/app/(tabs)/(home)/index.tsx`

import를 더한다.

```tsx
import { AppHeader, HeaderLogo } from '@/components/ui/app-header';
```

`SafeAreaView` 바로 안, 목록 위에 넣는다.

```diff
     <SafeAreaView style={styles.container} edges={['top']}>
+      <AppHeader left={<HeaderLogo />} />
       {renderBody()}
     </SafeAreaView>
```

> `SafeAreaView`의 `edges`에 `'top'`이 있는지 확인한다. 없으면 헤더가 상태바에 붙는다.

- [ ] **Step 2: 마이에 붙인다**

`mobile/app/(tabs)/(my)/index.tsx`

```tsx
import { AppHeader } from '@/components/ui/app-header';
```

```diff
     <SafeAreaView style={styles.container} edges={['top']}>
+      <AppHeader left="마이" />
       {renderBody()}
     </SafeAreaView>
```

- [ ] **Step 3: 게이트를 돌린다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

- [ ] **Step 4: 커밋**

```bash
git add "mobile/app/(tabs)/(home)/index.tsx" "mobile/app/(tabs)/(my)/index.tsx"
git commit -m "feat(mobile): 홈·마이 탭에 헤더 붙이기 (#806)"
```

---

## Task 10: 실기기 확인 (사용자)

**Files:** 없음

- [ ] **Step 1: Expo Go로 띄운다**

```bash
cd mobile && pnpm expo start
```

- [ ] **Step 2: 확인한다**

```
□ 홈 상단에 로고가 보인다
□ 마이 상단에 「마이」가 보인다
□ 로그아웃 상태에서는 벨이 없다
□ 안 읽은 알림이 있으면 벨에 빨간 점이 있다
□ 벨을 누르면 알림 목록이 열린다
□ 목록을 아래로 내리면 다음 페이지가 이어진다
□ 안 읽은 알림은 배경이 다르고 점이 있다
□ 「모두 읽음」을 누르면 점이 모두 사라지고 헤더의 점도 사라진다
□ 찜한 상품 알림을 누르면 그 상품 상세로 간다
□ 채팅·커뮤니티 알림을 누르면 안내가 뜨고, 「열기」를 누르면 브라우저가 열린다
□ 알림이 하나도 없을 때 빈 화면 문구가 보인다
```

> 채팅·커뮤니티 알림이 없어 시험할 수 없으면, 웹에서 커뮤니티 글에 댓글을 달아 알림을 만든다.

- [ ] **Step 3: 결과를 보고한다**

안 되는 게 있으면 어느 항목인지와 화면 사진을 남긴다.

---

## Task 11: 마무리

- [ ] **Step 1: 두 갈래를 합쳐 게이트를 돌린다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
cd .. && npx tsc --noEmit && pnpm build
git diff --name-only develop...HEAD -- 'src/**/*.ts' 'src/**/*.tsx' | tr '\n' '\0' | xargs -0 npx eslint
```

- [ ] **Step 2: 스펙에 실기기 결과를 적는다**

`docs/superpowers/specs/2026-07-31-app-header-notifications-design.md`에 실기기에서 드러난 것이 있으면 남긴다. 없으면 「확인 완료」만 적는다.

- [ ] **Step 3: PR**

`/commit-push`로 PR을 만든다. **base는 `develop`이다.** 본문에 `Close #806`과 `Close #804`를 넣는다.

---

## 완료 기준 (스펙 §10)

```
□ 홈·마이 탭에 헤더가 있고, 안 읽은 알림이 있으면 벨에 점이 보인다
□ 비로그인 상태에서는 벨이 없다
□ 벨을 누르면 알림 목록으로 간다
□ 목록이 무한스크롤로 이어지고, 로딩·오류·빈 화면이 각각 보인다
□ 안 읽은 알림은 배경과 점으로 구분된다
□ 「모두 읽음」을 누르면 점이 모두 사라진다
□ 상품 알림을 누르면 그 상품 상세로 간다
□ 채팅·커뮤니티 알림을 누르면 안내가 뜨고, 확인하면 앱 안 브라우저가 열린다
□ 웹: 홈 상단 · 홈 스크롤 후 · 커뮤니티 · 상품 상세에서 각각 알림을 열어 목록이 보인다
□ 웹: 알림이 열려 있는 동안 「상품 등록」 버튼이 오버레이에 가려진다
□ 웹: 상품 등록과 커뮤니티 글 작성의 모바일 헤더가 같아 보인다
□ 앱 tsc · lint · jest / 웹 tsc · eslint · build
```
