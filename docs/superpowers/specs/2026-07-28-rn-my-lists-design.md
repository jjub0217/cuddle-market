# 앱 내 목록 3종 설계 (찜한 상품 · 판매 내역 · 구매 내역)

**바퀴**: RN 앱 4바퀴 · **선행**: #784(앱 로그인 + 찜, PR #785 머지 완료)
**작성일**: 2026-07-28 (화)

## 1. 무엇을 만드는가

마이페이지에서 들어가는 목록 화면 셋을 만든다.

| 화면 | 데이터 |
|---|---|
| 찜한 상품 | `GET /profile/me/favorites` |
| 판매 내역 | `GET /profile/me/products` |
| 구매 내역 | `GET /profile/me/purchase-requests` |

목록은 **읽기 전용**이다. 다만 상품 카드 썸네일에 **찜 버튼**을 달아, 홈과 찜한 상품 목록에서는 찜을 켜고 끌 수 있게 한다(§5).

곁들여 **홈에서도 찜이 가능해진다.** 지금 앱은 찜하려면 상세 화면까지 들어가야 하는데, 웹은 목록 카드에서 바로 된다. 같은 카드를 쓰는 김에 그 격차를 없앤다.

### 범위 밖 (다음 바퀴)

| 항목 | 언제 | 왜 미루나 |
|---|---|---|
| 거래 상태 필터(전체/판매중/예약중/판매완료) | 5바퀴 | 상태를 **바꿀 수** 있게 될 때 함께 있어야 짝이 맞는다. 지금 필터만 넣으면 볼 수는 있는데 바꿀 수는 없다 |
| 거래 상태 변경 · 삭제 | 5바퀴 | API는 이미 있다(`PATCH /products/{id}/trade-status`, `DELETE /products/{id}`). 되돌릴 수 없는 동작이라 목록 화면이 자리를 잡은 뒤에 붙인다 |
| 상품 수정 | 6바퀴 | 수정 화면이 없으면 메뉴를 만들어도 **갈 곳이 없다** |
| 상품 등록 | 6바퀴 | 이미지 업로드가 딸려와 한 바퀴를 통째로 먹는다. 그때 "앱에 정말 필요한가"부터 다시 본다 |
| 차단 유저 · 내 글 | 미정 | 웹에는 있으나 이번 묶음(거래 관련)과 성격이 다르다 |

### 바퀴 순서를 이렇게 잡은 이유

**자주 쓰는 것부터, 싼 것부터.** 5바퀴(상태 변경·삭제)는 API가 이미 있어 새 화면이 필요 없는데, 판매자 입장에서는 값어치가 크다 — 물건이 팔렸을 때 "판매완료"로 바꾸지 못하면 결국 웹을 켜야 한다. 반대로 6바퀴(등록·수정)는 크지만 빈도가 낮다.

## 2. 화면 배치

웹의 **모바일 폭 동작과 같은 구조**를 따른다. 웹은 마이페이지의 메뉴 행을 누르면 패널이 옆에서 밀려 들어오고(`MyPage.tsx`의 `openMobilePanel`, `translate-x-full → translate-x-0`), 그 안에 목록이 무한스크롤로 뜬다. 앱에서는 같은 자리를 **스택 화면 push**로 낸다.

```
마이 (기존)                        판매 내역 / 구매 내역 / 찜한 상품
├ 프로필 카드                       ┌─ ← 뒤로   제목 ──────┐
├ 「내 상품 관리」  ← 새로 추가       │ [사진] 제목          │
│   판매 내역   →                    │        가격 · 찜 12  │
│   구매 내역   →   ────push────▶   ├──────────────────────┤
│   찜한 상품   →                    │ [사진] 제목          │
├ 「고객지원」                        └──────────────────────┘
└ 「계정」                             무한스크롤 · 탭바 유지
```

마이 탭 스택(`(my)/_layout.tsx`) 안에 쌓이므로 **탭바가 유지된다**. 이 스택은 #784에서 이 용도를 예고하며 만들어 뒀다("다음 바퀴의 찜한 상품 · 내 상품 목록이 여기 쌓인다").

**라우트**: `(my)/my-products` · `(my)/my-purchases` · `(my)/my-favorites`

`my-` 접두사를 붙이는 이유: 그룹 `(my)`는 주소에 나타나지 않는다. 그래서 파일을 `(my)/products.tsx`로 두면 **URL이 그냥 `/products`** 가 되는데, `(home)/products/[id].tsx`가 이미 `/products/[id]`를 쓰고 있다. 충돌은 아니지만 `/products`가 "내 판매 내역"을 뜻하게 되어 읽는 사람을 헷갈리게 한다.

#784에서 `(home)`과 `(my)`의 `index`가 둘 다 `/`가 되는 바람에 화면 이동이 조용히 무시된 적이 있다. 같은 종류의 함정을 미리 피한다.

**메뉴 이름**: 카드 제목 「내 상품 관리」, 행은 `판매 내역` · `구매 내역` · `찜한 상품`.
웹은 `구매내역`으로 붙여 썼는데 나머지 둘은 띄어썼다. 앱은 띄어쓰고, **웹의 표기도 함께 고친다**.

### 왜 세그먼트 탭이 아닌가

목록 셋을 한 화면에 탭으로 묶는 안도 검토했다. 택하지 않은 이유:

- 한 화면이 목록 3개의 무한스크롤 상태 · 로딩 · 오류를 동시에 들고 있어야 한다
- 이 화면들은 "가끔 확인"하는 성격이라, 목록 사이를 자주 오갈 일이 드물다
- 웹의 모바일 폭이 이미 화면 분리 방식이라, 맞추는 편이 웹·앱이 같아진다

대가: 판매 내역에서 구매 내역으로 가려면 뒤로 → 다시 선택으로 두 번이다. 받아들인다.

## 3. 핵심 구조 — 껍데기 하나 + 설정 세 벌

세 화면은 **제목 · 조회 함수 · 쿼리 키 · 빈 상태 문구**만 다르다. 공통 껍데기를 하나 만들고 각 화면은 설정만 바꿔 부른다.

```
components/my/my-product-list.tsx        ← 껍데기 (헤더 · FlatList · 무한스크롤 · 3상태)
      ↑                ↑                ↑
my-favorites.tsx  my-products.tsx  my-purchases.tsx   ← 각 20~30줄
```

하나를 제대로 만들면 나머지 둘은 거의 공짜다. 5바퀴에서 상태 필터를 넣을 때도 껍데기 한 곳만 고치면 된다.

껍데기가 받는 것:

```ts
interface Props {
  title: string;                                   // 헤더에 그릴 제목
  queryKey: readonly unknown[];                    // ['my','favorites'] 등
  fetchPage: (page: number) => Promise<MyListPage>;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  /** 찜한 상품 화면만 켠다. 켜면 각 카드 썸네일에 찜 버튼이 붙는다. */
  showFavorite?: boolean;
}
```

헤더는 각 화면이 직접 그린다(홈 · 상세 · 로그인과 같은 방식). **높이 52** — 화면 전환 시 위치가 흔들리지 않게 하려는 기존 값이다.

## 4. 데이터층

### 서버가 주는 모양이 홈과 같다 (대조 완료)

백엔드 소스에서 확인했다.

- 봉투: `page` · `size` · `total` · `content` · `totalPages` · `hasNext` · `hasPrevious` · `totalElements` · `numberOfElements` — 홈 검색과 **동일**
- 항목: `MyProductListResponse.content`는 홈 검색과 **같은 타입**(`ProductSearchItemResponse`). `FavoriteListResponse.content`(`FavoriteItemResponse`)도 **필드 14개가 전부 일치**(순서만 다름)
- 페이징: `@PageableDefault(size = 20)`, 최신순, `@PreAuthorize("isAuthenticated()")`

따라서 `@cuddle/shared`의 `Product` 타입과 앱의 `ProductCard`를 **그대로 재사용**한다. 새 타입을 만들지 않는다.

### 조회

```ts
// mobile/lib/my-lists.ts
fetchMyFavorites(page)  →  GET /profile/me/favorites?page={page}&size=20
fetchMyProducts(page)   →  GET /profile/me/products?page={page}&size=20
fetchMyPurchases(page)  →  GET /profile/me/purchase-requests?page={page}&size=20
```

- 셋 다 `apiFetch`로 보낸다 → 토큰 부착과 401 갱신이 자동으로 걸린다
- `useInfiniteQuery` + `getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined)` — 홈과 같은 형태
- 쿼리 키: `['my','favorites']` · `['my','products']` · `['my','purchases']`

### 거래 상태 표시

`ProductThumbnail`이 이미 처리한다 — 판매중/요청중은 오버레이 없음, 예약중은 스크림 0.40, 완료 계열은 0.60 + 중앙 흰 pill. 웹의 마이 목록과 같은 규칙이라 손댈 것이 없다.

## 5. 찜 해제 규칙 (웹·앱 통일)

**하트를 끄면 그 항목은 자리에 남는다. 화면을 나갔다 다시 들어오면 정리된다.**

### 왜 사라지게 하지 않나

모바일에서는 스크롤 중에 하트를 잘못 누르기 쉽다. 그런데 항목이 사라지고 나면 **되돌릴 방법이 사실상 없다** — 그 상품을 홈에서 다시 검색해 찾아야 한다. 자리에 남으면 한 번 더 누르는 것으로 끝난다.

대가: "찜 목록에 하트가 꺼진 항목이 남아 있는" 상태를 잠깐 허용한다. 화면을 나가면 정리되므로 오래 가지 않는다.

"사라지되 되돌리기 토스트"가 가장 좋지만, 앱에 토스트 체계가 없어 새로 만들어야 한다. 이번 범위 밖이다.

### 구현

| | 지금 | 바꿀 것 |
|---|---|---|
| 앱 `hooks/use-favorite.ts` | `['product', id]` · `['products']` 무효화 | `['my','favorites']`는 **무효화하지 않는다** (그대로 두면 됨) |
| 웹 `src/hooks/useFavorite.ts` | `onSuccess`에서 `['myFavorite']` 무효화 | 그 한 줄을 **제거** |

웹을 함께 고치는 이유는 두 플랫폼이 같은 동작이어야 하기 때문이다. 지금 웹은 찜을 빼면 재조회가 돌아 항목이 사라진다.

### 카드의 하트 버튼 — 썸네일 위 오른쪽 상단

웹은 `ProductThumbnail`에 하트 버튼을 얹어 둔다(`absolute top-1.5 right-2.5`). 홈이든 찜 목록이든 같은 카드를 쓰므로 어디서나 찜을 켜고 끈다. **앱의 `ProductThumbnail`에는 그게 없다** — 2바퀴에서 상세 화면만 만들다 보니 카드에는 안 붙였고, 그래서 앱은 찜하려면 상세까지 들어가야 한다.

앱 `ProductThumbnail`에 **선택적 하트**를 단다. 자리는 웹과 같은 **썸네일 위 오른쪽 상단**이다.

색은 웹 썸네일 하트와 같게 간다.

| 상태 | 색 | 왜 |
|---|---|---|
| 찜함 | `#FC8181` 채운 하트 | 상세 찜 버튼 · 웹(`fill-[#fc8181]`)과 같은 값 |
| 안 함 | **흰색** 외곽선 하트 | 사진 위에 얹히므로 회색(`#6B7280`)은 밝은 사진에서 묻힌다. 웹도 `stroke-white`다 |

밝은 사진에서도 흰 하트가 보이도록 **옅은 그림자**를 준다(웹의 `drop-shadow-md`에 해당). `IconSymbol`이 `style`을 그대로 넘겨주므로 `textShadow*`로 준다.

새 색은 만들지 않는다 — `#FC8181`과 흰색뿐이다.

메타 줄의 `찜 12` 글자는 **그대로 둔다.** 개수는 정보고 하트는 동작이라 역할이 다르다.

### 어느 화면에 다는가

| 화면 | 하트 | 왜 |
|---|---|---|
| 홈 | **있음** | 웹에는 있는데 앱만 없던 격차. 목록에서 바로 찜 |
| 찜한 상품 | **있음** | 여기서 찜을 빼는 것이 이 화면의 주 목적 |
| 판매 내역 | 없음 | **관리용 화면**이다. 5·6바퀴에 상태 변경 · 수정 · 삭제가 들어올 자리라 찜이 낄 곳이 아니다 |
| 구매 내역 | 없음 | 위와 같다 |

웹도 같은 구분을 한다 — 찜 목록만 `ProductCard`(하트 있음)를 쓰고, 판매·구매는 `MyList`(하트 없음, ⋮ 메뉴)를 쓴다.

**"내 물건은 찜할 수 없다"는 규칙이 아니다.** 상세 화면에서는 내가 올린 물건에도 찜이 된다(웹 `ProductActions.tsx`는 `isMyProduct`로 채팅하기↔수정하기만 바꾸고 찜 버튼은 조건 없이 그린다. 앱도 판별 코드가 없어 마찬가지다). 목록에서 안 보이는 건 금지가 아니라 **그 화면이 하려는 일이 찜이 아니어서**다.

### 탭 충돌

카드 전체가 이미 "탭하면 상세로"다. 하트를 누를 때 상세로 넘어가지 않게 이벤트 전파를 막아야 한다. 웹도 `handleHeartClick`에서 같은 처리를 한다.

## 6. 상태 · 오류 처리

`components/list-states.tsx`(로딩 · 오류 · 빈 · 푸터)를 그대로 쓴다. 화면별로 다른 것은 빈 상태 문구뿐이다.

| 화면 | 빈 상태 |
|---|---|
| 찜한 상품 | 찜한 상품이 없어요 |
| 판매 내역 | 등록한 상품이 없어요 |
| 구매 내역 | 구매 요청한 상품이 없어요 |

3상태를 섞지 않는 규칙은 홈과 같다 — 첫 로드 실패는 전체 화면 오류, 추가 페이지 실패는 푸터에서만 알린다.

**게스트 처리는 필요 없다.** 마이 탭 자체가 `tabPress`에서 가로막히므로(#784), 이 화면들에 게스트가 도달할 경로가 없다. 딥링크는 이번 범위 밖이다.

## 7. 파일

### 새로 만드는 것

| 경로 | 책임 |
|---|---|
| `mobile/lib/my-lists.ts` | 조회 함수 3개 |
| `mobile/lib/my-lists.test.ts` | 위 테스트 |
| `mobile/components/my/my-product-list.tsx` | 목록 화면 공통 껍데기 |
| `mobile/app/(tabs)/(my)/my-favorites.tsx` | 찜한 상품 |
| `mobile/app/(tabs)/(my)/my-products.tsx` | 판매 내역 |
| `mobile/app/(tabs)/(my)/my-purchases.tsx` | 구매 내역 |

### 고치는 것

| 경로 | 무엇을 |
|---|---|
| `mobile/app/(tabs)/(my)/index.tsx` | 「내 상품 관리」 카드 3줄 추가 |
| `mobile/components/product-thumbnail.tsx` | 썸네일 위 오른쪽 상단에 선택적 하트 버튼 |
| `mobile/components/product-card.tsx` | 하트 관련 prop을 썸네일로 넘김 |
| `mobile/app/(tabs)/(home)/index.tsx` | 홈 카드의 하트 켜기 |
| `src/hooks/useFavorite.ts` | `['myFavorite']` 무효화 제거 |
| `src/features/my-page/MyPage.tsx` | `구매내역` → `구매 내역` 표기 |

## 8. 검증

### 단위 테스트

`lib/my-lists.ts`의 조회 함수 3개. **토큰 부착을 반드시 덮는다** — #784에서 `products.ts`가 토큰 없이 조회해 찜 하트가 도로 꺼졌는데, 그때 테스트가 있었는데도 "토큰을 붙이는지"를 안 봐서 못 잡았다. 같은 실수를 반복하지 않는다.

- 로그인 상태면 `Authorization` 헤더가 붙는다
- `page`/`size` 쿼리 파라미터가 붙는다
- 실패 시 오류를 던진다

### 실기기 손 검증

1. 마이 → 「내 상품 관리」의 세 줄이 보인다
2. 각 화면 진입 → 목록이 뜬다, 탭바가 유지된다
3. 스크롤 끝까지 → 다음 페이지가 이어 붙는다
4. **홈 카드의 하트를 누른다** → 상세로 넘어가지 않고 하트만 켜진다 (탭 충돌 검증)
5. 그 상품이 찜한 상품 목록에 있다
6. 찜한 상품에서 하트 끄기 → **항목이 자리에 남고 하트만 꺼진다**
7. 뒤로 나갔다 다시 들어오기 → 그 항목이 사라져 있다
8. **판매 내역 · 구매 내역에는 하트가 없다**
9. 항목 탭 → 상품 상세로 이동, 뒤로 오면 목록 자리 유지
10. 빈 상태 문구 (해당 목록이 비어 있는 계정으로)

### 웹

찜 목록에서 하트를 끈 뒤 **항목이 남는지** 확인한다.

### 게이트

- 앱: `npx tsc --noEmit` · `npx jest` · `npx expo lint`
- 웹: `npx tsc --noEmit` · 변경 파일 `npx eslint`

## 9. 참고

- 선행 설계: `docs/superpowers/specs/2026-07-28-rn-auth-login-favorite-design.md`
- 선행 계획: `docs/superpowers/plans/2026-07-28-rn-auth-login-favorite-impl.md`
- 웹 마이페이지 모바일 동작: `src/features/my-page/MyPage.tsx`(메뉴 · 패널), `src/features/my-page/components/MyPagePanel.tsx`(목록)
- 백엔드 엔드포인트: `cmarket_api` `web/profile/controller/ProfileController.java`
