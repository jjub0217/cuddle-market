# 앱 헤더 + 알림 목록 설계 — 앱 8바퀴 (2026-07-31 금)

> 앱에 헤더를 만들어 알림으로 가는 길을 내고, 알림 목록 화면을 만든다.
> 그 과정에서 드러난 **웹 알림 오버레이 버그**와 **웹 모바일 헤더가 갈린 문제**를 같이 고친다.

---

## 1. 왜 지금 헤더·알림인가

앱에는 **헤더가 아예 없다.** 홈도 마이도 화면 맨 위부터 목록이 시작된다. 그래서 알림으로 갈 길이 없다.

```
7바퀴   이메일 회원가입          ✅ 완료
8바퀴   앱 헤더 + 알림 목록      🟢  ← 지금
9바퀴   커뮤니티 읽기 + 댓글 · 신고·차단(#805)
10바퀴  소셜 로그인
11바퀴  상품 등록 · 수정
12바퀴  채팅
```

알림은 **백엔드가 이미 다 되어 있다.** 6바퀴 조사에서 확인했다 — REST 4개(`GET /notifications`, `/unread-count`, `PATCH /{id}/read`, `/read-all`)가 완비돼 있고, 웹은 GraphQL을 거치지만 앱은 REST를 직접 부르면 된다. SSE는 필요 없다.

---

## 2. 범위

### 이번에 넣는 것

| 곳 | 무엇 |
|---|---|
| 앱 | 헤더 조각 — 홈·마이가 함께 쓴다 (왼쪽만 다름) |
| 앱 | 알림 벨 + 안 읽음 점 |
| 앱 | 알림 목록 화면 |
| 웹 | 알림 오버레이가 헤더 높이로 잘리는 버그 (#804) |
| 웹 | 모바일 뒤로가기 헤더를 공용 조각으로 통일 |

### 이번에 안 하는 것

- **앱 상세 헤더의 `⋮` + 신고·차단** — 9바퀴(#805). Play UGC 정책상 필수라 따로 뗐다
- **웹 상세 헤더에 뒤로가기** — 아래 §7-2에서 왜 안 하는지 적는다
- **푸시 알림** — 1.0 범위 밖. 앱을 켰을 때 조회하는 것으로 충분하다
- **검색** — 로드맵에서 1.0 이후다. 헤더에 자리만 비워 두지 않는다

---

## 3. 앱 헤더

### 조각 하나를 두 탭이 쓴다

```
mobile/components/ui/app-header.tsx

<AppHeader left={<Logo />} />     홈
<AppHeader left="마이" />         마이
```

```
┌──────────────────────────┐
│ [로고]              🔔 ● │   ● 는 안 읽은 게 있을 때만
└──────────────────────────┘
```

**왼쪽만 다르고 오른쪽(알림 벨)은 같다.** 9바퀴에 커뮤니티 탭이 생겨도 이 조각을 그대로 쓴다.

### 왜 왼쪽에 로고인가

당근은 그 자리에 **동네 이름**을 둔다. 동네 기반 서비스라 「지금 어느 동네를 보고 있나」가 늘 보여야 하기 때문이다. 커들마켓은 지역이 **상품의 속성**이지 화면 전체의 기준이 아니라서 그 자리가 빈다.

채울 후보는 로고뿐이다. 앱을 켰을 때 브랜드가 보이고, 웹 모바일 헤더와도 같은 구성이 된다.

> 로고는 눌러도 아무 데도 안 간다. 이미 홈이기 때문이다. 마이 탭에서는 「마이」라는 글자가 그 자리를 대신한다.

### 정한 것들

| 항목 | 결정 | 왜 |
|---|---|---|
| 뱃지 | **숫자 없이 점만** | 웹이 빨간 점만 쓴다. 개수는 목록에서 보면 된다 |
| 비로그인 | **벨을 숨긴다** | 웹도 로그인 전에는 벨이 없다. 눌러서 로그인으로 보내는 것보다 없는 편이 정직하다 |
| 안 읽은 수 | `GET /notifications/unread-count` | 화면에 들어올 때와 앱이 앞으로 돌아올 때 다시 조회한다 |
| 높이 | 로그인·회원가입 화면과 같은 값(52) | 앱 안에서 헤더 높이가 갈리면 안 된다 |

### SSE를 쓰지 않는 이유

웹은 SSE로 실시간 갱신을 한다. 앱은 안 한다 — 6바퀴 조사 결론이다.

앱은 화면을 벗어나면 연결을 유지할 이유가 없고, **앱에 들어올 때 다시 조회하면 같은 결과**를 얻는다. 연결을 계속 붙들면 배터리와 네트워크를 쓴다. 실시간이 정말 필요해지는 건 푸시 알림을 넣을 때고 그건 1.0 밖이다.

---

## 4. 앱 알림 목록

```
mobile/app/notifications.tsx          화면 (헤더는 화면이 직접 그린다)
mobile/lib/notifications.ts           API 4개 + 타입 + 경로 규칙
mobile/components/notifications/      목록 항목 조각
```

```
┌──────────────────────────────┐
│ ‹  알림              모두 읽음 │
├──────────────────────────────┤
│ 💔 찜한 상품의 거래 상태가...  ● │  안 읽음: 베이지 배경 + 주황 점
│    '개구리 사료' 상품의...      │
│    2개월 전                    │
├──────────────────────────────┤
│ 🏷 ...                        │  읽음: 흰 배경
└──────────────────────────────┘
```

### 정한 것들

| 항목 | 결정 |
|---|---|
| 무한스크롤 | 웹과 같이 `size=10` |
| 3상태 | 로딩·오류·빈 화면 — 기존 `components/list-states.tsx` 재사용 |
| 안 읽음 표시 | 배경색 + 점 (웹과 같게) |
| 「모두 읽음」 | `PATCH /notifications/read-all` |
| 누르면 | 읽음 처리 → 이동 (§5) |

### 제목은 서버 값이 아니라 정해진 문구를 쓴다

응답에 `title`이 오지만 웹은 그걸 안 쓰고 **타입별로 정해진 문구**를 보여준다(`NOTIFICATION_MESSAGES`, `NotificationItem.tsx:32`).

```
PRODUCT_FAVORITE_STATUS_CHANGED   찜한 상품의 거래 상태가 변경되었습니다
POST_COMMENT                      게시글에 새로운 댓글이 달렸습니다
...                               (8종)
```

**앱도 같은 문구를 쓴다.** 서버 `title`을 그대로 쓰면 웹과 앱의 같은 알림이 다른 문구로 보인다. 본문(`content`)은 서버 값을 그대로 쓴다 — 상품 이름 같은 게 들어 있다.

### 아이콘 — 웹과 완전히 같게는 못 한다

웹은 타입마다 다른 Lucide 아이콘을 쓴다. 앱 `IconSymbol`에는 아이콘이 8개뿐이고 알림용이 없다.

`IconSymbol`의 매핑에 MaterialIcons 이름 8개를 더한다.

| 알림 종류 | 웹 (Lucide) | 앱 (MaterialIcons) |
|---|---|---|
| `CHAT_NEW_ROOM` | MessageSquarePlus | `add-comment` |
| `CHAT_NEW_MESSAGE` | MessageCircleMore | `chat` |
| `PRODUCT_FAVORITE_STATUS_CHANGED` | HeartCrack | `heart-broken` |
| `PRODUCT_FAVORITE_PRICE_CHANGED` | Tag | `local-offer` |
| `ADMIN_SANCTION` | ShieldAlert | `gpp-maybe` |
| `POST_DELETED` | Trash2 | `delete` |
| `COMMENT_REPLY` | Reply | `reply` |
| `POST_COMMENT` | MessageSquareText | `comment` |

**같은 뜻의 아이콘을 고른 것이고 모양이 똑같지는 않다.** 억지로 맞추려면 SVG를 새로 들여야 하는데, 아이콘 여덟 개를 위해 그럴 값어치가 없다.

---

## 5. 갈 곳 없는 알림 — 이번 바퀴의 핵심 결정

알림은 8종인데 **앱이 갈 수 있는 곳은 3종뿐이다.**

| 종류 | 가는 곳 | 앱에 있나 |
|---|---|---|
| `PRODUCT_FAVORITE_STATUS_CHANGED` | 상품 상세 | ✅ |
| `PRODUCT_FAVORITE_PRICE_CHANGED` | 상품 상세 | ✅ |
| `ADMIN_SANCTION` | 마이페이지 | ✅ |
| `CHAT_NEW_ROOM` | 채팅방 | ❌ 12바퀴 |
| `CHAT_NEW_MESSAGE` | 채팅방 | ❌ 12바퀴 |
| `POST_DELETED` | 커뮤니티 목록 | ❌ 9바퀴 |
| `COMMENT_REPLY` | 커뮤니티 상세 | ❌ 9바퀴 |
| `POST_COMMENT` | 커뮤니티 상세 | ❌ 9바퀴 |

**9바퀴·12바퀴를 지나면 저절로 풀리는 한시적 문제**지만, 그동안 눌러도 갈 데가 없다.

### 결정 — 안내를 먼저 보여주고 앱 안 브라우저로 연다

```
알림 누름
  → 앱에 화면이 있으면   그 화면으로 (상품 상세 · 마이)
  → 없으면              「웹에서 열려요. 로그인이 필요할 수 있어요」 안내
                        → 확인하면 앱 안 브라우저로 웹 페이지를 연다
```

`expo-web-browser`는 Expo SDK에 들어 있어 **Expo Go에서도 돈다.** 새 네이티브 모듈이 아니다.

### 왜 안내를 먼저 넣나 — 로그인이 풀려 있을 수 있다

웹은 세션을 `localStorage`에 둔다(`userStore.ts:84-85`). 앱 안 브라우저는 폰 기본 브라우저의 저장소를 공유한다.

```
안드로이드   Chrome Custom Tabs      → 크롬 프로필 공유
iOS         SFSafariViewController  → 사파리와 웹사이트 데이터 공유
```

그래서 이렇게 갈린다.

```
폰 브라우저로 웹에 로그인해 둔 사람   →  내용이 보인다
앱만 쓴 사람                       →  로그인 화면을 만난다
```

**앱만 쓰는 사람이 대부분일 것이다.** 아무 예고 없이 로그인 화면을 만나면 「고장 났나」가 된다. 예상하고 만나는 것과 갑자기 만나는 것은 다르다.

> ⚠️ 저장 위치가 `localStorage`인 것은 코드로 확인했다. 앱 안 브라우저가 폰 브라우저와 저장소를 공유하는 것은 **문서상 그렇지만 실기기로는 확인 전**이다.

### 앱 세션을 웹으로 넘기는 것은 이번 범위 밖이다

앱이 가진 토큰을 웹 주소에 실어 보내는 방법이 있지만 **일회용 토큰 발급이라 백엔드 작업**이고 보안 검토가 따른다. 소셜 로그인(10바퀴)에서 비슷한 문제를 다루므로 그때 같이 본다.

---

## 6. 웹 알림 오버레이가 헤더 높이로 잘린다 (#804)

### 증상

```
홈 상단에서 열기            정상
커뮤니티에서 열기           헤더 줄만 보이고 목록이 없다
홈에서 스크롤 후 열기        같은 증상    ← 진단으로 예측하고 실기기로 확인했다
깨진 상태에서 홈 탭 누르기   그제서야 목록이 보인다
```

### 원인 — `backdrop-blur-sm`

`Header.tsx:148`

```js
const showSolid = !isHome || scrolledPast          // 103행

showSolid
  ? '... backdrop-blur-sm'                          // 148행  ← 원인
  : isHome ? 'bg-hero-surface' : 'bg-transparent'
```

CSS에서 **`backdrop-filter`가 걸린 요소는 그 안의 `position: fixed` 자식에게 「기준 상자」가 된다.** `transform`·`filter`와 같은 규칙이다.

```
평소                          backdrop-blur가 있을 때
fixed inset-0                 fixed inset-0
  → 화면 전체 기준              → 헤더 상자 기준 (높이 48px)
```

그리고 **알림 오버레이만 `<header>` 안에 있다.**

```
<header>                          ← backdrop-blur-sm
  <UserControls>
    <MobileNotificationsOverlay/>   ← UserControls.tsx:91
  </UserControls>
</header>
<MobileSearchOverlay/>            ← 헤더 밖이라 멀쩡하다
<MobileNavigation/>               ← 헤더 밖이라 멀쩡하다
```

홈 상단에서만 되는 이유는 그때만 `showSolid=false`라 blur가 없기 때문이다.

### 고치는 법

오버레이를 `<header>` 밖으로 뺀다. 검색·내비 오버레이가 이미 그 자리에 있으므로 **같은 자리로 옮기는 것**뿐이다. 열림 상태를 `UserControls`에서 `Header`로 올린다.

**주석으로 함정을 남긴다** — 헤더에 `backdrop-blur`가 있는 한 그 안에 전체화면 오버레이를 두면 안 된다.

### FAB 겹침도 같은 원인이다 — 따로 고칠 게 없다

알림 오버레이 위에 「상품 등록」 버튼이 떠 있다. 처음에는 별개 문제로 보고 「오버레이가 열리면 FAB을 숨기자」고 적었으나, 값을 확인해보니 **같은 뿌리였다.**

```
Z_INDEX.HEADER          z-30
Z_INDEX.FLOATING_BUTTON z-30
Z_INDEX.MODAL           z-[100]   ← 오버레이가 쓰는 값
```

```
<header class="z-30">                 ← z-index가 있는 fixed 요소는 「쌓임 맥락」을 만든다
  <MobileNotificationsOverlay class="z-[100]">
       ↑ 이 100은 헤더 안에서만 유효하다. 바깥과 겨룰 때는 헤더의 z-30으로 취급된다
</header>
...
<FAB class="fixed z-30">              ← 같은 30인데 DOM에서 뒤 → FAB이 이긴다
```

`z-[100]`을 줘도 소용없었던 이유다. **오버레이를 헤더 밖으로 빼면 크기(`backdrop-filter`)와 순서(쌓임 맥락)가 한꺼번에 해결된다.** FAB을 따로 숨기는 코드는 넣지 않는다.

---

## 7. 웹 모바일 뒤로가기 헤더 통일

### 무엇이 문제였나

상품 등록과 커뮤니티 글 작성이 **같은 역할의 모바일 헤더를 각자 손으로 만들었고, 값이 다르다.**

```jsx
// ProductPost.tsx:105
'bg-primary-200 sticky top-0 ... justify-between px-3.5 py-4 md:hidden'
                ↑ 베이지        ↑ 제목이 가운데로 밀린다    ArrowLeft가 흰색

// CommunityPostForm.tsx:206
'sticky top-0 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden'
                                      ↑ 흰 배경 + 아래 선    ↑ 왼쪽 정렬
```

> 처음에는 `SimpleHeader`가 갈린 줄 알았는데 아니었다. 두 곳의 `SimpleHeader` 호출은 **props까지 완전히 같다.** 문제는 그 위에 각자 얹은 모바일 전용 헤더였다.

**공용 조각이 없어서 생긴 일이고, 페이지가 늘면 또 갈린다.**

### 고치는 법

```
src/components/header/MobileBackHeader.tsx      ← 신설

ProductPost.tsx            손으로 만든 것 제거 → 조각 사용
CommunityPostForm.tsx      손으로 만든 것 제거 → 조각 사용
```

**커뮤니티 쪽(흰 배경 · 왼쪽 정렬 · 아래 선)에 맞춘다.** 본문이 흰색이라 베이지가 뚝 끊겨 보였다.

### 7-2. 웹 상세 헤더에는 뒤로가기를 넣지 않는다

당근 앱처럼 웹 상세도 `‹ 로고 ⋮`로 바꿀지 검토했으나 **안 하기로 했다.**

```
웹 모바일   시스템 뒤로가기 + 브라우저 툴바 ←   → 화면 안 뒤로가기는 중복이다
앱          시스템 뒤로가기뿐 (iOS는 그것도 없다) → 화면 안 뒤로가기가 필수다
```

바꿀 때의 손실도 크다.

- **파급** — 상품 상세만 바꾸면 커뮤니티 상세는 옛 헤더가 된다. 같은 「상세」인데 다르면 더 어색하다. 사실상 모든 상세 화면을 건드리는 일이다
- **통로가 막힌다** — 웹 모바일은 헤더가 검색·알림에 닿는 유일한 길이다. 앱은 탭바가 있어 괜찮지만 웹은 다르다

**얻는 것이 「인상 통일」뿐인데 잃는 것이 크다.** 그리고 오늘까지 지켜온 통일은 **규칙**(검증 값·3상태·문구·색)이었지 **레이아웃 관행**이 아니었다. 웹은 문서고 앱은 화면 스택이라 관행이 다른 것이 자연스럽다.

---

## 8. 조사로 확정된 사실

### 알림 API — 백엔드는 이미 다 되어 있다

```
GET   /api/notifications                목록 (page, size)
GET   /api/notifications/unread-count   안 읽은 개수
PATCH /api/notifications/{id}/read      하나 읽음
PATCH /api/notifications/read-all       전체 읽음
```

응답 필드: `notificationId · notificationType · title · content · relatedEntityType · relatedEntityId · isRead · readAt · createdAt`

### 이동 규칙은 `relatedEntityType`으로 갈린다

웹 `src/lib/utils/getNavigationPath.ts`가 이미 이 규칙을 갖고 있다. 앱도 같은 규칙을 쓴다.

```
CHAT_ROOM  → 채팅방        PRODUCT → 상품 상세      POST → 커뮤니티 상세
그 외        ADMIN_SANCTION → 마이 · POST_DELETED → 커뮤니티 목록 · 나머지 → 홈
```

### 일부 알림은 자동으로 지워진다

`NotificationType`에 `autoDeletable` 값이 붙어 있고, `NotificationCleanupScheduler`가 매일 04시에 돈다. 거래·이력성 알림(`PRODUCT_FAVORITE_STATUS_CHANGED` · `ADMIN_SANCTION`)은 보존된다.

**앱이 신경 쓸 것은 없다.** 목록을 다시 조회하면 서버가 알아서 정리된 결과를 준다.

---

## 9. 하지 않는 것

- **푸시 알림** — 1.0 밖. Expo Go에서 안 되기도 한다
- **SSE 실시간 갱신** — §3에 이유를 적었다
- **알림 설정 화면** (어떤 알림을 받을지 고르기) — 백엔드에 그런 API가 없다
- **알림 삭제** — 웹에도 없다. 서버가 자동으로 정리한다
- **앱 상세 헤더 `⋮`** — 9바퀴(#805)
- **웹 상세 헤더 교체** — §7-2

---

## 10. 완료 기준

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

---

## 11. 이후로 미룬 것

| 무엇 | 왜 |
|---|---|
| 앱 신고·차단 (#805) | Play UGC 정책 필수. 범위가 커서 9바퀴로 뗐다 |
| 앱에서 웹으로 세션 넘기기 | 일회용 토큰 발급이 필요하다. 소셜 로그인(10바퀴)에서 같이 본다 |
| 푸시 알림 | 1.0 밖 |
| 웹 테스트 러너 (#799) | 이번에도 웹 변경을 손으로만 확인하게 된다 |

---

## 12. 참고

- 이전 바퀴 설계: `docs/superpowers/specs/2026-07-31-rn-signup-design.md`
- 6바퀴 조사(알림 API 완비 확인): `docs/superpowers/specs/2026-07-30-app-release-track-design.md` §6
- 웹 알림: `src/components/header/components/MobileNotificationsOverlay.tsx` · `notification-section/`
- 웹 이동 규칙: `src/lib/utils/getNavigationPath.ts`
- 웹 아이콘·문구: `src/constants/constants.ts` (`iconMap` · `NOTIFICATION_MESSAGES`)
- 앱 하단 시트(7바퀴에 공용화): `mobile/components/ui/bottom-sheet.tsx`
