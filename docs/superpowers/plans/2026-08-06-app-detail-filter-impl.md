# 앱 세부 필터 구현 계획 (#855)

> 설계: `docs/superpowers/specs/2026-08-06-app-detail-filter-design.md`
> 브랜치: `feature/855--app-detail-filter`
> 15바퀴(#854)에서 만든 것 위에 얹는다.

## 못 박아 둘 것 — 조각들이 주고받는 모양

**조건이 여덟 개로 늘어난다.** 하나씩 넘기면 손이 많이 가므로 **한 덩어리**로 다닌다.

```ts
// mobile/lib/products.ts — 지금 넷에서 늘린다
export interface ProductListParams {
  page: number;
  keyword?: string;
  petType?: string;         // 대분류
  petDetailType?: string;   // 소분류        ← 새로
  categories?: string;
  productType?: string;     // SELL | REQUEST ← 새로
  productStatuses?: string; // 상품 상태      ← 새로
  minPrice?: number;        // 가격 구간      ← 새로
  maxPrice?: number;        //               ← 새로
  addressSido?: string;     // 지역          ← 새로
  addressGugun?: string;    //               ← 새로
  sortBy?: string;          // 정렬          ← 새로
  sortOrder?: string;       //               ← 새로
}

// mobile/lib/products/filters.ts (새로) — 화면들이 함께 쓰는 상태 모양
export interface ProductFilters {
  petType: string | null;
  petDetailType: string | null;
  category: string | null;
  productType: string | null;
  productStatus: string | null;
  price: { min: number; max: number | null } | null;
  sido: string | null;
  gugun: string | null;
  sortBy: string;           // 기본 'createdAt'
}
export const EMPTY_FILTERS: ProductFilters
/** 조건을 서버가 받는 모양으로 바꾼다. 빈 값은 뺀다 */
export function toParams(f: ProductFilters, page: number, keyword?: string): ProductListParams
```

⚠️ **「전체」는 빈 값이다.** 15바퀴에서 정한 규칙 그대로 — `'ALL'` 같은 글자를 보내면
서버가 그런 종류를 찾는다.

---

## Task 1: 조건 자료구조와 서버로 보내는 길

**파일**
- 만듦: `mobile/lib/products/filters.ts` · `filters.test.ts`
- 고침: `mobile/lib/products.ts` (`ProductListParams` 늘리기)
- 고침: `mobile/lib/products.test.ts`

- [ ] **1-1.** 시험 먼저 — `toParams` 가 빈 값을 빼는지, 가격이 min/max 로 갈라지는지
- [ ] **1-2.** `ProductListParams` 를 위 모양으로 늘린다. 넣는 방식은 15바퀴와 같다
      (`if (값) query.set(...)`)
- [ ] **1-3.** ⚠️ **가격은 숫자다.** `maxPrice` 가 `null` 인 구간(10만원 이상)은 **안 보낸다**
- [ ] **1-4.** ⚠️ **정렬은 둘로 나뉜다.** 웹 `SORT_TYPE` 의 id 는 `createdAt` ·
      `orderedLowPriced` · `orderedHighPriced` · `favoriteCount` 인데, 서버는
      `sortBy` + `sortOrder` 를 받는다. **바꿔 주는 표**를 여기 둔다
      (저가순 → `sortBy=price, sortOrder=asc` 식). 웹이 어떻게 바꾸는지 먼저 열어볼 것
- [ ] **1-5.** `npx jest lib/products` · 커밋

---

## Task 2: 소분류 줄 (대분류를 고르면 나타난다)

**파일**
- 고침: `mobile/components/products/product-filter-row.tsx` · 시험

- [ ] **2-1.** `PET_DETAIL_OPTIONS_BY_TYPE[대분류]` 로 줄을 하나 더. **대분류가 없으면 안 그린다**
- [ ] **2-2.** ⚠️ **대분류를 바꾸면 고른 소분류를 푼다.** 안 풀면 맞지 않는 조건이 남는다
- [ ] **2-3.** 안에 이미 있는 `FilterPillRow` 를 그대로 쓴다. 새로 만들지 마라
- [ ] **2-4.** 시험 — 대분류를 고르면 소분류가 나온다 · 바꾸면 풀린다 · 「전체」면 줄이 없다
- [ ] **2-5.** 커밋

---

## Task 3: 카테고리를 이미지로

**파일**
- 만듦: `mobile/assets/images/category/*.webp` (8개)
- 고침: `mobile/components/products/product-filter-row.tsx`

- [ ] **3-1.** 웹에서 옮긴다 — `public/images/category/` 의 food · toy · house · health ·
      clothing · walking · grooming · etc
- [ ] **3-2.** 코드 ↔ 파일 표를 만든다. 웹 `CATEGORY_ICON_IMAGES` 를 보고 맞춘다
- [ ] **3-3.** ⚠️ **`require` 는 정적이어야 한다.** `require('...' + code)` 는 안 된다 —
      코드마다 적은 표를 둔다
- [ ] **3-4.** 그림 + 이름. 고른 것이 눈에 띄게
- [ ] **3-5.** 커밋

---

## Task 4: 판매/판매요청 · 정렬 줄 (목록 바로 위, 고정)

**파일**
- 만듦: `mobile/components/products/product-list-toolbar.tsx` · 시험

- [ ] **4-1.** 왼쪽 `[전체][판매][판매요청]`, 오른쪽 `[⚙] 정렬▾`
      값은 웹 `PRODUCT_TYPE_TABS` · `SORT_TYPE` 에서 가져온다. **새로 짓지 마라**
- [ ] **4-2.** 정렬은 눌러서 고르는 작은 목록. 시트를 또 쓰거나 간단한 목록으로
- [ ] **4-3.** ⚠️ **상품 개수는 안 넣는다** — 웹에 없다(설계 §2)
- [ ] **4-4.** 시험 — 고르면 알린다 · 지금 고른 것이 표시된다
- [ ] **4-5.** 커밋

---

## Task 5: 세부 필터 시트

**파일**
- 만듦: `mobile/components/products/detail-filter-sheet.tsx` · 시험

- [ ] **5-1.** `components/ui/bottom-sheet.tsx` 를 껍데기로 쓴다. 새로 만들지 마라
- [ ] **5-2.** 상태(4) · 가격(4구간) · 지역(시/도 → 시/군/구)
- [ ] **5-3.** ⚠️ **지역은 줄바꿈(wrap)**. 시/군/구가 최대 30개다(경기도)
- [ ] **5-4.** ⚠️ **시/도를 바꾸면 고른 시/군/구를 푼다** (대분류→소분류와 같은 이유)
- [ ] **5-5.** `[초기화]` `[적용]`. ⚠️ **「적용」을 눌러야 반영된다.**
      그냥 닫으면 **열 때 상태로 되돌린다** — 고르던 것을 버린다
- [ ] **5-6.** ⚠️ 시트는 루트에 그린다 — `insets.bottom` 을 자기가 더한다.
      **측정되는 상자에** 줘야 한다(#843에서 겪었다)
- [ ] **5-7.** 시험 — 고르고 적용하면 알린다 · 그냥 닫으면 안 알린다 · 초기화 · 시/도를 바꾸면 시/군/구가 풀린다
- [ ] **5-8.** 커밋

---

## Task 6: 목록 조각에 다 붙인다

**파일**
- 고침: `mobile/components/products/product-list-view.tsx` · 시험

- [ ] **6-1.** 상태를 `ProductFilters` 한 덩어리로 바꾼다(지금은 둘로 흩어져 있다)
- [ ] **6-2.** ⚠️ **`queryKey` 에 조건을 다 넣는다.** 하나라도 빠지면 그 조건만 안 먹는다
      (15바퀴에서 겪었다 — 안 넣으면 뒤섞인 목록이 된다)
- [ ] **6-3.** **필터 줄을 `FlatList` 의 `ListHeaderComponent` 로 옮긴다** → 스크롤되어 사라진다
- [ ] **6-4.** ⚠️ **빈 화면·오류일 때는 필터가 보여야 한다.** `ListHeaderComponent` 는
      목록이 있을 때만 그려지므로, 그 두 경우는 **밖에 따로** 그린다.
      안 그러면 조건을 되돌릴 길이 없어진다(15바퀴에서 겪은 그 문제)
- [ ] **6-5.** 툴바(판매/판매요청·정렬·⚙)는 **밖에 고정**
- [ ] **6-6.** `reset()` 이 새 조건들도 다 푸는지 확인
- [ ] **6-7.** 시험 — 조건마다 서버에 실린다 · 빈 화면에서도 필터가 보인다 · reset
- [ ] **6-8.** `pnpm gate:mobile` · 커밋

---

## Task 7: 실기기 확인

게이트가 초록이어도 따로 봐야 한다.

- [ ] 대분류를 고르면 소분류가 나오고, 바꾸면 풀린다
- [ ] 카테고리 그림이 제대로 나온다 (안 깨지고, 이름과 맞는다)
- [ ] 필터 줄이 스크롤되어 사라지고, 툴바는 남는다
- [ ] **빈 화면에서도 필터가 보인다**
- [ ] `⚙` → 시트. 상태·가격·지역이 다 들어간다
- [ ] **「적용」을 눌러야 바뀐다. 그냥 닫으면 버린다**
- [ ] 시트가 탭바·기기 바에 안 가린다
- [ ] 조건을 바꾼 뒤 스크롤해도 목록이 안 뒤섞인다
- [ ] **목록이 몇 장 보이는지** — 필터가 세로를 너무 먹지 않는지

---

## 함정 (설계 §7 요약)

```
카테고리 이미지    앱에 없다. 웹에서 옮긴다. require 는 정적이어야 한다
대분류·시도 변경   아래 단계를 푼다
조건 바뀜         queryKey 에 **다** 넣는다
필터 스크롤       빈 화면·오류일 때는 밖에 따로 그린다
시트 아래 여백     루트에 그리니 insets.bottom 을 측정되는 상자에
「적용」 안 누르고 닫기  고르던 것을 버린다
정렬 값 변환      웹 id(orderedLowPriced 등) → 서버 sortBy + sortOrder
```
