# 앱 신고·차단 설계 — 앱 9바퀴 (2026-08-01 토)

> 앱에 **신고**와 **차단**을 넣는다. 지금 앱에는 둘 다 없다.
> 판매자를 눌러 들어가는 **프로필 화면**도 이번에 만든다 — 차단이 놓일 자리이기도 하다.

---

## 1. 왜 지금인가

**Play 출시 요건이다.** 있으면 좋은 게 아니라 없으면 심사에서 걸릴 수 있다.

> **공개 UGC 앱**: *"사용자와 콘텐츠를 신고하고, 사용자를 차단하는 인앱 기능을 구현해야 한다"*
> **1:1 상호작용 앱**: *"사용자를 차단하는 인앱 기능을 제공해야 한다"*
> — [Google Play User Generated Content policy](https://support.google.com/googleplay/android-developer/answer/9876937)

커들마켓은 셋 다 해당한다.

```
상품 등록          이용자가 올리는 콘텐츠   ← 이미 앱에 있다
커뮤니티 글·댓글    이용자가 올리는 콘텐츠   ← 앱에 화면이 없다
채팅              1:1 상호작용            ← 12바퀴
```

계정 삭제 페이지(#800)와 같은 성격이다.

> 비공개 테스트 심사를 통과한 것은 통과했다는 뜻이지 정책을 다 지켰다는 뜻이 아니다.

```
8바퀴   앱 헤더 + 알림 목록      ✅ 완료 (#806)
9바퀴   앱 신고·차단            🟢  ← 지금 (#805)
10바퀴  소셜 로그인
11바퀴  상품 등록 · 수정
12바퀴  채팅
```

---

## 2. 범위

### 이번에 넣는 것

| 무엇 | 어디에 |
|---|---|
| 판매자 프로필 화면 | **신설.** 상품 상세의 판매자 카드를 눌러 들어간다 |
| 상품 상세 헤더 `⋮` | **신설.** 상품 신고 · 판매자 차단 |
| 신고 화면 | **신설.** 상품용·사용자용이 같은 화면을 쓴다 |
| 차단 확인 창 | **신설** |
| 마이 ▸ 차단 목록 | **신설.** 차단한 사람 보기 · 해제 |
| 웹 차단 안내 문구 | 지킬 수 없는 두 줄을 고친다 (§7) |

### 이번에 안 하는 것

| 무엇 | 왜 |
|---|---|
| 신고 이미지 첨부 | 11바퀴(상품 등록)에서 이미지 조각을 만들 때 함께. 지금 하면 신고용으로 한 번 만들고 상품 등록에서 또 손본다 |
| 커뮤니티 글 신고 | 앱에 커뮤니티 화면이 없다. 화면이 생길 때 같이 |
| 채팅에서 차단·신고 | 12바퀴 |
| 차단 시 상품 목록에서 숨기기 | 백엔드 작업이다. 별도 이슈로 뗀다 (§7) |
| 내 상품 수정·삭제 | 11바퀴. 이번엔 내 것이면 `⋮` 자체를 감춘다 |
| 매너온도 같은 것 | 우리 서비스에 없다 (참고한 당근 화면에 있던 것) |

**Play 요건은 이 범위로 충족된다.** 정책이 요구하는 것은 「신고할 수 있을 것」과 「차단할 수 있을 것」이지, 「증거 사진을 붙일 수 있을 것」이 아니다.

---

## 3. 백엔드는 이미 다 있다

**백엔드 작업이 없다.** REST가 완비돼 있어 앱이 GraphQL 없이 바로 쓴다.

```
POST   /api/reports/products/{productId}          상품 신고
POST   /api/reports/users/{targetUserId}          사용자 신고
POST   /api/reports/blocks/users/{userId}         차단
GET    /api/reports/blocks/users                  차단 목록
DELETE /api/reports/blocks/users/{userId}         차단 해제

GET    /api/profile/{userId}                      프로필
GET    /api/profile/{userId}/products             판매상품 (SELL만)
GET    /api/profile/{userId}/purchase-requests    판매요청 (REQUEST만)
```

`GET /profile/{userId}`가 주는 것 중 화면이 쓰는 것:

```java
private String nickname;
private String profileImageUrl;
private String addressSido;
private String addressGugun;
private String introduction;    // 소개글
private Boolean isBlocked;      // 내가 이미 차단했는지
private Boolean isReported;     // 내가 이미 신고했는지
```

`isBlocked`가 있어서 `⋮`를 「차단하기」로 그릴지 「차단 해제」로 그릴지 **추측 없이 정한다.**

---

## 4. 화면 흐름

```
상품 상세
  │
  ├─ 판매자 카드 누름 ──────► 판매자 프로필
  │                          ├ 사진 · 닉네임 · 지역 · 소개글
  │                          ├ 탭  [판매상품] [판매요청]
  │                          ├ 상품 목록 (무한스크롤)
  │                          └ ⋮ ──► 시트  「신고하기」 「차단하기」/「차단 해제」
  │                                        │
  │                                        ├─ 신고 ──► 신고 화면 (사용자 사유 7개)
  │                                        └─ 차단 ──► 확인 창
  │
  └─ 헤더 ⋮ ──► 시트  「신고하기」 「판매자 차단하기」
                       │
                       ├─ 신고 ──► 신고 화면 (상품 사유 8개)
                       └─ 차단 ──► 확인 창

마이 ▸ 차단 목록 ──► 차단한 사람들 · 각 줄에서 해제
```

### 왜 차단을 두 곳에 두나

웹은 **프로필에만** 차단이 있다. 참고한 당근은 **상품 상세 `⋮`에만** 있다. 우리는 둘 다 둔다.

```
프로필에 두는 이유    웹과 같아진다
상세에 두는 이유      상품을 보다가 이상하면 그 자리에서 차단하고 싶다
중복이 괜찮은 이유    이 저장소는 이미 중복을 택했다 — 고객지원이 마이 탭·햄버거 양쪽에 있고
                    웹도 푸터·모바일내비 양쪽에 둔다 (#806에서 정한 기준)
```

### 왜 `⋮`마다 담는 게 다른가

신고 대상이 둘(상품 / 사용자)이고 사유 목록도 다르다. **지금 보고 있는 것**이 신고 대상이 되게 맞춘다.

```
상품 상세 ⋮    상품 신고하기 · 판매자 차단하기
프로필   ⋮    사용자 신고하기 · 차단하기(해제)
```

판매자 자체가 문제면 판매자 카드를 눌러 프로필로 들어가면 된다 — 그 길이 이번에 새로 생긴다.

---

## 5. 판매자 프로필 화면

### 탭은 둘이다 — 「전체」를 안 만드는 이유

백엔드가 이렇게 나뉘어 있다.

```
GET /profile/{userId}/products            판매 상품(SELL)만    ← "판매 요청은 제외됩니다"
GET /profile/{userId}/purchase-requests   판매 요청(REQUEST)만
                                          「전체」 엔드포인트가 없다
```

「전체」를 만들려면 앱이 두 목록을 합쳐야 하는데 **무한스크롤과 상성이 나쁘다.** 두 목록이 각자 페이지를 세니 「다음 페이지」가 어느 쪽인지, 날짜순으로 섞으면 페이지 경계에서 순서가 깨지는지를 앱이 떠안는다.

웹도 전체 없이 둘이다(`USER_PAGE_TABS = [판매상품, 판매요청]`). **웹과 같게 간다.**

> 「전체」가 정말 필요해지면 백엔드에 엔드포인트를 하나 두는 게 옳다. 별도 이슈다.

### 마이 탭의 칩과 다른 축이다

```
마이 판매내역 칩    전체 · 판매중 · 예약중 · 판매완료    ← 거래 상태 (한 목록 안에서 거름)
프로필 탭          판매상품 · 판매요청                 ← 상품 종류 (목록이 아예 다름)
```

그래서 `StatusFilterChips`를 그대로 못 쓴다. 탭 조각을 새로 만든다.

### 라우트를 두 스택에 둔다

```
app/(tabs)/(home)/users/[id].tsx      본체
app/(tabs)/(my)/users/[id].tsx        위를 re-export
```

상품 상세가 이미 이렇게 돼 있고, 그 이유가 실기기로 확인돼 주석에 남아 있다.

> *"상세가 홈 스택에만 있으면, 찜 목록에서 상품을 눌렀을 때 expo-router가 홈 탭으로 옮겨간 뒤 거기에 상세를 쌓는다. 그래서 뒤로 가면 찜 목록이 아니라 홈이 나온다(실기기에서 확인)."*
> — `mobile/app/(tabs)/(my)/products/[id].tsx`

미는 쪽이 그룹까지 적어야 한다 — `/(tabs)/(my)/users/7` 처럼.

---

## 6. 신고 화면

### 한 화면이 상품·사용자를 다 그린다

사유 목록과 보낼 주소만 다르고 나머지가 같다. 화면을 둘로 나누면 같은 코드가 두 벌이 된다.

```
/report?kind=product&id=42&title=개구리 사료   →  POST /reports/products/42
/report?kind=user&id=7&nickname=쩐성           →  POST /reports/users/7
```

**루트 스택에 둔다**(탭 안이 아니라). 로그인·회원가입·알림과 같은 이유다 — 집중해서 끝내는 화면이라 탭바가 보이면 안 된다.

### 모달이 아니라 전체 화면인 이유

웹은 가운데 모달 하나에 사유·상세·이미지·제출이 다 있다. 앱은 **전체 화면**으로 바꾼다.

```
앱 관행       로그인·회원가입·알림·메뉴가 다 전체 화면이다
좁은 폭       모달에 라디오 8개 + 글상자를 넣으면 세로로 눌린다
당근도 그렇다  ⋮ → 시트 → 화면이 바뀐다
```

다만 **당근처럼 두 단계로 쪼개지는 않는다.** 당근은 사유 목록 화면 → 상세 입력 화면인데, 그러려면 사유마다 부제 문구를 새로 지어야 한다(우리 상수에는 라벨만 있다). 없는 것을 지어내지 않는다 — 8바퀴에서 세 번 걸린 실수다.

### 값은 웹 그대로

| 항목 | 값 | 출처 |
|---|---|---|
| 신고 사유 | **필수** · 하나만 고른다 | `register('reasonCode', { required: true })` |
| 상세 사유 | **선택** · 최대 300자 · 글자수 표시 | `ReportApiErrors.detailReason.maxLength` |
| 제출 버튼 | 사유를 고르기 전엔 안 눌린다 | `disabled={!isValid}` |
| 보내는 값 | `reasonCodes` · `detailReason`(있을 때만) — **FormData** | `ProductReportModal` |

---

## 7. 차단 안내 문구를 고친다 — 웹도 함께

### 무엇이 문제인가

웹 `USER_BLOCK_ALERT_LIST`가 지킬 수 없는 약속을 한다.

```
「차단한 사용자는 더 이상 채팅을 보내거나 상품을 볼 수 없습니다」   ✗ 상품은 그대로 보인다
「해당 사용자의 게시글과 프로필이 숨김 처리됩니다」                ✗ 숨겨지지 않는다
「이미 진행 중인 거래는 영향을 받지 않습니다.」                    ✓
「차단은 언제든 '마이페이지 > 차단 목록'에서 해제할 수 있습니다」    ✓
```

백엔드에서 차단을 실제로 보는 곳은 **채팅과 프로필뿐**이다. 상품 목록·검색 서비스에는 차단 참조가 아예 없다.

```
UserBlockRepository를 쓰는 곳
  ChatService              메시지
  ProfileService           isBlocked 값을 돌려줄 뿐
  (상품 서비스에는 없음)
```

### 어떻게 고치나

```
차단한 사용자는 회원님에게 채팅을 보낼 수 없습니다
이미 진행 중인 거래는 영향을 받지 않습니다
차단은 언제든 '마이 > 차단 목록'에서 해제할 수 있습니다     (웹은 '마이페이지 > 차단 목록')
```

**웹 문구도 같이 고친다.** 「웹과 같게」가 기조지만 **틀린 것을 같게 맞추는 건 통일이 아니다.**

> ⚠️ 이 판단은 **백엔드 코드를 읽고** 내린 것이지 실제로 차단해보고 확인한 게 아니다.
> 배포 후 계정 둘로 확인하고, 다르면 문구를 되돌린다.

상품 목록에서 차단 사용자를 거르는 일은 백엔드 작업이라 **별도 이슈로 뗀다.** 그게 되면 문구를 원래대로 돌리면 된다.

---

## 8. 이미 차단·신고했을 때

```
차단   isBlocked를 받는 곳    → 「차단 해제」로 그린다
       못 받는 곳             → 「차단하기」로 두고, 서버가 막으면 그 메시지를 보여준다
신고   언제나 눌러볼 수 있다    → 서버가 막으면 「이미 신고한 상품입니다」
```

### 왜 신고는 미리 안 알려주나

`isReported`는 **프로필 응답에만** 있고 상품 응답에는 없다. 사용자 신고만 미리 알려주면 「사용자 신고는 알려주는데 상품 신고는 안 알려준다」가 되어 오히려 일관성이 깨진다. 웹도 눌러보고 알려주는 방식이다.

---

## 9. 파일 구조

### 갈래 A · 앱

| 파일 | 책임 |
|---|---|
| `mobile/lib/reports.ts` | **신설.** 신고·차단 API 6개 + 오류 판별 + 안내 문구 |
| `mobile/lib/reports.test.ts` | **신설.** 위 테스트 |
| `mobile/lib/user-profile.ts` | **신설.** 프로필 3종 조회 |
| `mobile/lib/user-profile.test.ts` | **신설.** 위 테스트 |
| `mobile/app/report.tsx` | **신설.** 신고 화면 (루트 스택) |
| `mobile/app/(tabs)/(home)/users/[id].tsx` | **신설.** 판매자 프로필 |
| `mobile/app/(tabs)/(my)/users/[id].tsx` | **신설.** 위를 re-export |
| `mobile/app/(tabs)/(my)/blocked-users.tsx` | **신설.** 차단 목록 |
| `mobile/components/user-profile/profile-head.tsx` | **신설.** 사진·닉네임·지역·소개글 |
| `mobile/components/user-profile/kind-tabs.tsx` | **신설.** [판매상품][판매요청] |
| `mobile/components/report/block-confirm.tsx` | **신설.** 차단 확인 창 |
| `mobile/components/product-detail/detail-header.tsx` | 오른쪽에 `⋮` 추가 |
| `mobile/components/product-detail/seller-card.tsx` | 누르면 프로필로 |
| `mobile/app/(tabs)/(my)/index.tsx` | 「차단 목록」 줄 추가 |
| `mobile/app/_layout.tsx` | `report` 화면 등록 |
| `mobile/lib/auth/api.ts` | FormData면 Content-Type을 안 넣게 (§10-①) |

### 갈래 B · 웹

| 파일 | 책임 |
|---|---|
| `src/constants/constants.ts` | 신고 사유·차단 문구를 `@cuddle/shared`에서 re-export만 한다 (§10-④) |

**웹 갈래는 이 파일 하나뿐이다.** 문구 수정도 여기서 일어난다 — 값이 shared로 옮겨가므로 실제 문구는 shared에서 고친다.

### 공통

| 파일 | 책임 |
|---|---|
| `packages/shared/src/` | 신고 사유 2종 + 차단 안내 문구의 **원본**. 웹·앱이 여기서 가져다 쓴다 (§10-④) |

### 재사용하는 것

새로 만들 게 생각보다 적다.

| 필요한 것 | 이미 있는 것 |
|---|---|
| `⋮` 하단 시트 | `components/my/product-action-sheet.tsx` — 항목 목록을 받아 그리기만 한다 |
| 시트 껍데기 | `components/ui/bottom-sheet.tsx` |
| 목록 + 무한스크롤 + 3상태 | `components/my/my-product-list.tsx` · `list-states.tsx` · `ProductCard` |
| 확인 창 | `components/my/logout-modal.tsx`와 같은 결 |
| 신고 사유·문구 | 웹 `constants.ts` |

---

## 10. 함정 — 계획에 못 박을 것

### ① `apiFetch`가 Content-Type을 항상 붙인다

`mobile/lib/auth/api.ts:83`

```ts
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...
};
```

신고는 **FormData**로 보내야 한다. React Native의 `fetch`는 FormData를 주면 `multipart/form-data; boundary=...`를 **스스로** 붙이는데, 우리가 먼저 넣으면 boundary가 없어 서버가 파싱을 못 한다.

**body가 FormData면 Content-Type을 빼도록 고친다.** 이미지 첨부를 뺐어도 웹이 FormData로 보내니 서버가 그걸 기대한다 — 피할 수 없다.

### ② 상품 상세 응답에 `isBlocked`가 없다

`packages/shared/src/types/product.ts`의 `SellerInfo`에 없고, 서버도 프로필 응답에만 준다.

상세 `⋮`는 「판매자 차단하기」로만 두고, 이미 차단했으면 서버가 막게 한다. **차단 여부 하나 때문에 상세를 열 때마다 프로필 요청을 더 보내지 않는다.**

### ③ 프로필 조회에 로그인이 필요하다

`@PreAuthorize("isAuthenticated()")`가 걸려 있다. 게스트가 판매자 카드를 누르면 401이 온다.

마이 탭과 같은 방식으로 **누를 때 로그인 화면으로 보낸다.** (마이 탭은 `(tabs)/_layout.tsx`의 `listeners.tabPress`에서 막는다 — 그 주석에 「화면 안에서 밀어내면 무한 루프가 된다」는 이유가 적혀 있다.)

### ④ 신고 사유 상수는 `@cuddle/shared`에 올린다 — 웹도 거기서 가져다 쓴다

지금은 웹 `constants.ts`에만 있고 앱에도 필요하다. 복사해두면 한쪽만 고쳐질 자리다 — 8바퀴에서 문구를 따로 지었다가 갈린 일이 있었다.

**웹도 shared를 이미 쓴다**(`getTimeAgo`를 여러 화면이 가져다 쓴다). 그래서 이렇게 한다.

```
packages/shared      PRODUCT_REPORT_REASON · USER_REPORT_REASON · USER_BLOCK_ALERT_LIST  ← 원본
웹 constants.ts      위를 re-export만 한다        ← 웹 코드는 import 경로를 안 바꿔도 된다
앱                   @cuddle/shared에서 바로 쓴다
```

**웹의 import 경로는 그대로 둔다.** `constants.ts`에서 다시 내보내면 웹 화면 여러 곳을 건드리지 않아도 되고, 값이 나오는 곳은 한 군데가 된다.

> `POST_REPORT_REASON`(커뮤니티 글)은 안 올린다. 앱에 커뮤니티 화면이 없어 쓸 데가 없다 — 쓰는 데가 생길 때 올린다.

### ⑤ 판매자 카드가 지금은 안 눌린다

`seller-card.tsx`에 이유가 적혀 있다.

> *"프로필로 이동하는 동작은 로그인이 있어야 해서 이번 바퀴에는 없다."*

로그인이 생겼으니(3바퀴) 이제 열면 된다. 주석도 함께 고친다.

### ⑥ 내 것이면 `⋮`를 감춘다

내 상품·내 프로필에 「신고하기」가 보이면 안 된다. `useMe()`의 내 `id`와 `sellerId`를 비교한다.

---

## 11. 완료 기준

```
□ 판매자 카드를 누르면 프로필로 간다 · 게스트면 로그인 화면이 뜬다
□ 프로필에 사진 · 닉네임 · 지역 · 소개글이 보인다
□ 탭을 바꾸면 판매상품/판매요청 목록이 각각 나오고 무한스크롤이 된다
□ 프로필 ⋮ → 신고하기 → 사유를 고르고 제출하면 접수된다
□ 프로필 ⋮ → 차단하기 → 확인 후 ⋮가 「차단 해제」로 바뀐다
□ 상품 상세 ⋮ → 상품 신고하기 · 판매자 차단하기가 각각 된다
□ 이미 신고한 것을 또 신고하면 「이미 신고한 상품입니다」가 뜬다
□ 내 상품 · 내 프로필에는 ⋮가 없다
□ 마이 ▸ 차단 목록에서 차단한 사람이 보이고 해제된다
□ 차단 안내 문구가 웹 · 앱 모두 새 문구다
□ 앱 tsc · lint · jest / 웹 tsc · eslint
```

### 배포 후에 확인할 것

```
□ 차단하면 정말 채팅만 막히고 상품은 그대로 보이는지 (계정 둘 필요 — §7)
□ 신고가 관리자 화면(/admin/reports)에 들어오는지
```

---

## 12. 참고

- 8바퀴 설계: `docs/superpowers/specs/2026-07-31-app-header-notifications-design.md`
- 웹 신고 모달: `src/components/modal/ReportModalBase.tsx` · `ProductReportModal.tsx` · `UserReportModal.tsx`
- 웹 차단 모달: `src/components/modal/BlockModal.tsx`
- 웹 프로필 화면: `src/features/UserPage.tsx`
- 신고 사유·차단 문구: `src/constants/constants.ts`
- 백엔드: `~/Desktop/cmarket_api` — `web/report/controller/` · `web/profile/controller/`
