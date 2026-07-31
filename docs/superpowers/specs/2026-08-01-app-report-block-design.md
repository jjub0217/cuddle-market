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
| 판매자 프로필 화면 | **신설.** 상품 상세의 판매자 카드를 눌러 들어간다. 차단한 사람이면 「차단 유저」 배지 (§8) |
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
| 차단 시 상품 목록에서 숨기기 | 백엔드 작업이다. **#809**로 뗐다 (§7) |
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
| 보내는 값 | **JSON** — 아래 표 참고 (필드 이름이 둘이 다르다) | 서버 DTO (§10-①) |

### ⚠️ 상품과 사용자의 필드 이름이 다르다

```json
상품 신고   POST /reports/products/{id}
            { "reasonCodes": ["ILLEGAL_ITEM"], "detailReason": "…" }
                          ↑ 복수형 · 배열

사용자 신고  POST /reports/users/{id}
            { "reasonCode": "HARASSMENT", "detailReason": "…" }
                          ↑ 단수형 · 문자열
```

`ProductReportRequest.reasonCodes`는 `List<String>`이고 `UserReportRequest.reasonCode`는 `String`이다. **한 화면이 둘을 다 그리므로 여기서 갈린다** — 보낼 때만 모양을 바꾼다.

화면은 어느 쪽이든 **사유 하나만** 고르게 한다(웹도 라디오다). 상품 쪽은 고른 하나를 배열로 감싸 보낸다.

`detailReason`은 비어 있으면 아예 안 보낸다. `imageUrls`도 이번엔 안 보낸다 — 셋 다 선택 필드다.

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

> ✅ **실제로 확인했다**(2026-08-01, 사용자). 차단해도 그 사람 상품이 목록에서 안 사라진다.
> 코드를 읽고 세운 추정이 실물과 맞았다. 추정이 아니라 사실이므로 문구를 고치는 게 맞다.

상품 목록에서 차단 사용자를 거르는 일은 백엔드 작업이라 **#809로 뗐다.** 그게 되면 문구를 원래대로 돌리면 된다.

---

## 8. 이미 차단·신고했을 때 — 웹 화면을 그대로 따른다

웹 프로필을 모바일 폭으로 열어 확인했다(2026-08-01). 값이 있는 곳은 **미리 보여준다.**

```
프로필 ⋮     isBlocked  → 「차단 해제」        아니면 「차단하기」
             isReported → 「신고완료」(회색·안 눌림)   아니면 「신고하기」
             ↑ 웹 ProfileData.tsx가 이미 이렇게 그린다

상품 상세 ⋮   응답에 isBlocked·isReported가 없다
             → 「판매자 차단하기」·「상품 신고하기」로 두고, 서버가 막으면 그 메시지를 보여준다
```

### 왜 상세만 다른가

상품 상세 응답에는 두 값이 없다(§10-②). 그것 하나 때문에 상세를 열 때마다 프로필 요청을 더 보내는 건 과하다. **값이 있으면 쓰고, 없으면 서버가 알려주게 한다.**

> 한때 이 자리에 「신고는 어디서든 눌러보고 알려준다, 웹도 그렇다」고 적혀 있었다. **틀렸다.** 웹 프로필은 `isReported`로 「신고완료」를 회색으로 그린다. 웹 모달 코드만 보고 화면을 안 열어봤다.

### 「차단 유저」 배지

차단한 사람의 프로필에는 닉네임 옆에 배지가 붙는다. 웹 `ProfileData.tsx`와 같다.

```
[지니] 🛡 차단 유저        빨간 계열 알약 (웹: bg-red-100 · text-red-600 · ShieldAlert)
```

### 소개글이 없을 때 — 웹과 일부러 다르게 간다

웹은 이렇게 그린다.

```tsx
{data?.introduction || '소개글을 작성해주세요'}
```

**남의 프로필에서도 「소개글을 작성해주세요」가 뜬다.** 내 프로필용 안내가 조건 없이 나오는 것으로, 웹 쪽 결함으로 보인다(실제 화면에서 확인).

앱은 **소개글이 없으면 그 줄을 아예 안 그린다.** 남에게 「작성해주세요」라고 할 이유가 없다.

> 웹도 같이 고치는 게 맞지만 이번 범위 밖이다 — 신고·차단과 무관한 결함이라 **#810**으로 뗐다.

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

### ① `apiFetch`는 손대지 않는다 — 서버가 JSON을 받는다

한때 이 자리에 「신고는 FormData라 `apiFetch`의 `Content-Type`을 고쳐야 한다」고 적혀 있었다. **틀렸다.** 웹 `ProductReportModal`이 `FormData`를 만들길래 서버도 multipart를 받는 줄 알고 컨트롤러를 안 열어봤다.

```java
@PostMapping("/products/{productId}")
public ResponseEntity<...> reportProduct(
        @PathVariable Long productId,
        @Valid @RequestBody ProductReportRequest request   // @RequestBody = JSON
)
```

`@ModelAttribute`도 `@RequestPart`도 아니다. 그리고 컨트롤러 주석이 이미지 처리까지 못 박아 뒀다.

> *"이미지는 별도 이미지 업로드 API(`POST /api/images`)를 통해 업로드한 후 반환된 URL 리스트를 `imageUrls` 필드에 전달합니다."*

즉 **이미지도 JSON 안의 URL 목록**이다. FormData는 애초에 필요가 없다.

그래서 이렇게 된다.

```
지금 (이미지 없음)   JSON { reasonCodes, detailReason }              → apiFetch 그대로
나중 (이미지 추가)   POST /api/images 로 올려 URL을 받고
                    JSON { reasonCodes, detailReason, imageUrls }   → 그래도 apiFetch 그대로
```

**앱의 모든 API가 지나는 길목을 안 건드린다.** 이미지를 나중에 얹어도 마찬가지다.

### 곁가지 — 웹은 신고 경로가 둘로 갈려 있다

```
상품 신고    api.post('/reports/products/…', formData)   REST + FormData
사용자 신고   fetchGraphQL('mutation ReportUser …')       GraphQL
```

사용자 신고는 **된다**(프로필에 「신고완료」가 뜬다). GraphQL 경로라 `@RequestBody`와 무관하다.

**상품 신고는 깨져 있다 — 배포 환경에서 재현했다(2026-08-01).**

```
POST https://cmarket-api.duckdns.org/api/reports/products/58
→ 500 Internal Server Error   "서버 내부 오류가 발생했습니다."
```

`@RequestBody`(JSON)를 기대하는 곳에 FormData가 들어가 파싱이 터진 것으로 보인다. **#808로 뗐다.**

**앱은 이 버그와 무관하다** — 처음부터 REST + JSON으로 붙이기 때문이다. 오히려 이 설계가 옳다는 증거가 됐다.

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

## 10-1. 실기기 확인 결과 (2026-08-01)

**완료 기준을 모두 통과했다.** 배포 후로 미룬 것은 「신고가 관리자 화면에 들어오는지」 하나뿐이다.

### 계획이 놓친 것 넷 — 실기기에서 드러났다

| 무엇 | 무엇이 틀렸나 | 왜 놓쳤나 |
|---|---|---|
| **차단 목록이 늘 비었다** | 응답이 한 겹 더 감싸져 있고(`data.blockedUsers.content`) 식별자가 `blockedUserId`였다. `data.content` · `userId`로 가정했다 | **서버 DTO를 안 열어보고** 다른 목록 API 모양을 그대로 가정했다. 테스트까지 그 가정으로 써서 **틀린 모양을 통과시키고 있었다** |
| 프로필에 헤더가 둘 | `(home)` 스택이 화면마다 `headerShown: false`를 적는 구조인데 `users/[id]` 등록을 빠뜨려, 네이티브 헤더가 「users/[id]」라는 라우트 이름을 그대로 띄웠다 | 새 화면을 더할 때마다 나는 실수다. `screenOptions`로 스택 전체에서 끄는 게 맞다 |
| 탭이 마이와 다른 모양 | 「마이 판매내역처럼」이라고 했는데 밑줄형으로 만들었다 | `StatusFilterChips`가 거래 상태 타입에 묶여 못 쓴다고 봤는데, **못 쓰는 건 로직이었지 생김새가 아니었다.** 축이 다르다는 데만 매달려 모양까지 바꿔 놓고 알리지 않았다 |
| 성공·실패 알림이 RN Alert | 안드로이드·iOS가 각자 그리는 창이라 앱의 다른 창과 모양이 갈렸다 | 웹에 성공 창이 없어 앱에만 넣으면서 가장 쉬운 것을 골랐다 |

### 그래서 더 만든 것

```
components/ui/toast-host.tsx     잠깐 떴다 사라지는 알림 (한 번에 하나)
lib/toast.ts                     그 상태
components/ui/confirm-dialog.tsx 「정말 할까요?」 공용 창
```

**토스트는 웹 것을 안 가져왔다.** 웹 `toastStore`는 순수 zustand라 옮길 수 있지만 큐(최대 5개)가 있고 `crypto.randomUUID()`가 RN에 없다. 지금 앱에서 토스트 쓸 곳은 신고·차단 둘뿐이라 큐가 남아돌고, 웹 store를 건드리면 웹 토스트 전체가 회귀 시험 대상이 된다. **토스트 쓸 곳이 느는 11바퀴(상품 등록)·12바퀴(채팅)에 규칙을 `@cuddle/shared`로 올려 웹과 나눠 쓰는 게 순서다.**

`ConfirmDialog`는 차단하기·차단 해제가 같은 모양이어야 해서 뺐다(한쪽이 RN Alert이었다). 로그아웃·탈퇴 창은 이번 바퀴가 만든 게 아니라 손대지 않았다 — 나중에 같이 접을 자리다.

**신고·차단 흐름에는 이제 RN `Alert`이 하나도 없다.**

### 토스트 위치는 실행 중에 못 잰다

`useBottomTabBarHeight()`는 탭 화면 **안에서만** 도는데, 토스트는 화면이 바뀌어도 살아남아야 해서 탭 밖(루트 `_layout`)에 있다. 그래서 실기기 스크린샷으로 재서 값을 못 박았다.

```
시스템 내비(insets.bottom)  약 44      화면 바닥에서 탭바 위까지  약 98
탭바 본문                   약 53      →  insets.bottom + 72 (탭바 56 + 여백 16)
```

탭바 모양을 바꾸면(아이콘·글자 크기 등) 이 값도 같이 봐야 한다.

### 되풀이한 실수

8바퀴에서 세 번 걸린 **「실물을 안 보고 추정한 뒤 그럴듯한 이유를 붙였다」** 가 이번에도 나왔다. 이번에는 **서버 DTO**였다.

앞으로 API를 붙일 때는 **응답 DTO를 직접 열어보고** 필드 이름과 감싸진 모양을 확인한다. 「다른 API가 이러니 이것도 그렇겠지」는 추정이다.

---

## 11. 완료 기준

```
□ 판매자 카드를 누르면 프로필로 간다 · 게스트면 로그인 화면이 뜬다
□ 프로필에 사진 · 닉네임 · 지역 · 소개글이 보인다
□ 탭을 바꾸면 판매상품/판매요청 목록이 각각 나오고 무한스크롤이 된다
□ 프로필 ⋮ → 신고하기 → 사유를 고르고 제출하면 접수된다
□ 프로필 ⋮ → 차단하기 → 확인 후 ⋮가 「차단 해제」로 바뀌고 닉네임 옆에 「차단 유저」 배지가 붙는다
□ 이미 신고한 사용자의 프로필 ⋮에는 「신고완료」가 회색으로 안 눌리게 보인다
□ 소개글이 없는 사람의 프로필에는 소개글 줄이 아예 안 보인다 (웹처럼 「작성해주세요」가 뜨지 않는다)
□ 상품 상세 ⋮ → 상품 신고하기 · 판매자 차단하기가 각각 된다
□ 이미 신고한 것을 또 신고하면 「이미 신고한 상품입니다」가 뜬다
□ 내 상품 · 내 프로필에는 ⋮가 없다
□ 마이 ▸ 차단 목록에서 차단한 사람이 보이고 해제된다
□ 차단 안내 문구가 웹 · 앱 모두 새 문구다
□ 앱 tsc · lint · jest / 웹 tsc · eslint
```

### 배포 후에 확인할 것

```
□ 신고가 관리자 화면(/admin/reports)에 들어오는지
```

> 나머지는 **실기기에서 모두 통과했다**(§10-1).

> 「차단해도 상품이 안 숨겨지는가」는 **이미 확인됐다**(§7). 그래서 여기서 뺐다.

---

## 12. 참고

- 8바퀴 설계: `docs/superpowers/specs/2026-07-31-app-header-notifications-design.md`
- 웹 신고 모달: `src/components/modal/ReportModalBase.tsx` · `ProductReportModal.tsx` · `UserReportModal.tsx`
- 웹 차단 모달: `src/components/modal/BlockModal.tsx`
- 웹 프로필 화면: `src/features/UserPage.tsx`
- 신고 사유·차단 문구: `src/constants/constants.ts`
- 백엔드: `~/Desktop/cmarket_api` — `web/report/controller/` · `web/profile/controller/`
