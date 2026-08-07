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

- [x] **1-1.** 시험 먼저 — `toParams` 가 빈 값을 빼는지, 가격이 min/max 로 갈라지는지
- [x] **1-2.** `ProductListParams` 를 위 모양으로 늘린다. 넣는 방식은 15바퀴와 같다
      (`if (값) query.set(...)`)
- [x] **1-3.** ⚠️ **가격은 숫자다.** `maxPrice` 가 `null` 인 구간(10만원 이상)은 **안 보낸다**
- [x] **1-4.** ⚠️ **정렬은 둘로 나뉜다.** 웹 `SORT_TYPE` 의 id 는 `createdAt` ·
      `orderedLowPriced` · `orderedHighPriced` · `favoriteCount` 인데, 서버는
      `sortBy` + `sortOrder` 를 받는다. **바꿔 주는 표**를 여기 둔다
      (저가순 → `sortBy=price, sortOrder=asc` 식). 웹이 어떻게 바꾸는지 먼저 열어볼 것
- [x] **1-5.** `npx jest lib/products` · 커밋

---

## Task 2: 소분류 줄 (대분류를 고르면 나타난다)

**파일**
- 고침: `mobile/components/products/product-filter-row.tsx` · 시험

- [x] **2-1.** `PET_DETAIL_OPTIONS_BY_TYPE[대분류]` 로 줄을 하나 더. **대분류가 없으면 안 그린다**
- [x] **2-2.** ⚠️ **대분류를 바꾸면 고른 소분류를 푼다.** 안 풀면 맞지 않는 조건이 남는다
- [x] **2-3.** 안에 이미 있는 `FilterPillRow` 를 그대로 쓴다. 새로 만들지 마라
- [x] **2-4.** 시험 — 대분류를 고르면 소분류가 나온다 · 바꾸면 풀린다 · 「전체」면 줄이 없다
- [x] **2-5.** 커밋

---

## Task 3: 카테고리를 이미지로

**파일**
- 만듦: `mobile/assets/images/category/*.webp` (8개)
- 고침: `mobile/components/products/product-filter-row.tsx`

- [x] **3-1.** 웹에서 옮긴다 — `public/images/category/` 의 food · toy · house · health ·
      clothing · walking · grooming · etc
- [x] **3-2.** 코드 ↔ 파일 표를 만든다. 웹 `CATEGORY_ICON_IMAGES` 를 보고 맞춘다
- [x] **3-3.** ⚠️ **`require` 는 정적이어야 한다.** `require('...' + code)` 는 안 된다 —
      코드마다 적은 표를 둔다
- [x] **3-4.** 그림 + 이름. 고른 것이 눈에 띄게
- [x] **3-5.** 커밋

---

## Task 4: 판매/판매요청 · 정렬 줄 (목록 바로 위, 고정)

**파일**
- 만듦: `mobile/components/products/product-list-toolbar.tsx` · 시험

- [x] **4-1.** 왼쪽 `[전체][판매][판매요청]`, 오른쪽 `[⚙] 정렬▾`
      값은 웹 `PRODUCT_TYPE_TABS` · `SORT_TYPE` 에서 가져온다. **새로 짓지 마라**
- [x] **4-2.** 정렬은 눌러서 고르는 작은 목록. 시트를 또 쓰거나 간단한 목록으로
- [x] **4-3.** ⚠️ **상품 개수는 안 넣는다** — 웹에 없다(설계 §2)
- [x] **4-4.** 시험 — 고르면 알린다 · 지금 고른 것이 표시된다
- [x] **4-5.** 커밋

---

## Task 5: 세부 필터 시트

**파일**
- 만듦: `mobile/components/products/detail-filter-sheet.tsx` · 시험

- [x] **5-1.** `components/ui/bottom-sheet.tsx` 를 껍데기로 쓴다. 새로 만들지 마라
- [x] **5-2.** 상태(4) · 가격(4구간) · 지역(시/도 → 시/군/구)
- [x] **5-3.** ⚠️ **지역은 줄바꿈(wrap)**. 시/군/구가 최대 30개다(경기도)
- [x] **5-4.** ⚠️ **시/도를 바꾸면 고른 시/군/구를 푼다** (대분류→소분류와 같은 이유)
- [x] **5-5.** `[초기화]` `[적용]`. ⚠️ **「적용」을 눌러야 반영된다.**
      그냥 닫으면 **열 때 상태로 되돌린다** — 고르던 것을 버린다
- [x] **5-6.** ⚠️ 시트는 루트에 그린다 — `insets.bottom` 을 자기가 더한다.
      **측정되는 상자에** 줘야 한다(#843에서 겪었다)
- [x] **5-7.** 시험 — 고르고 적용하면 알린다 · 그냥 닫으면 안 알린다 · 초기화 · 시/도를 바꾸면 시/군/구가 풀린다
- [x] **5-8.** 커밋

---

## Task 6: 목록 조각에 다 붙인다

**파일**
- 고침: `mobile/components/products/product-list-view.tsx` · 시험

- [x] **6-1.** 상태를 `ProductFilters` 한 덩어리로 바꾼다(지금은 둘로 흩어져 있다)
- [x] **6-2.** ⚠️ **`queryKey` 에 조건을 다 넣는다.** 하나라도 빠지면 그 조건만 안 먹는다
      (15바퀴에서 겪었다 — 안 넣으면 뒤섞인 목록이 된다)
- [x] **6-3.** **필터 줄을 `FlatList` 의 `ListHeaderComponent` 로 옮긴다** → 스크롤되어 사라진다
- [x] **6-4.** ⚠️ **빈 화면·오류일 때는 필터가 보여야 한다.** `ListHeaderComponent` 는
      목록이 있을 때만 그려지므로, 그 두 경우는 **밖에 따로** 그린다.
      안 그러면 조건을 되돌릴 길이 없어진다(15바퀴에서 겪은 그 문제)
- [x] **6-5.** 툴바(판매/판매요청·정렬·⚙)는 **밖에 고정**
- [x] **6-6.** `reset()` 이 새 조건들도 다 푸는지 확인
- [x] **6-7.** 시험 — 조건마다 서버에 실린다 · 빈 화면에서도 필터가 보인다 · reset
- [x] **6-8.** `pnpm gate:mobile` · 커밋

---

## Task 7: 실기기 확인

게이트가 초록이어도 따로 봐야 한다.

- [x] 대분류를 고르면 소분류가 나오고, 바꾸면 풀린다
- [x] 카테고리 그림이 제대로 나온다 (안 깨지고, 이름과 맞는다)
- [x] 필터 줄이 스크롤되어 사라지고, 툴바는 남는다
- [x] **빈 화면에서도 필터가 보인다**
- [x] `⚙` → 시트. 상태·가격·지역이 다 들어간다
- [x] **「적용」을 눌러야 바뀐다. 그냥 닫으면 버린다**
- [x] 시트가 탭바·기기 바에 안 가린다
- [x] 조건을 바꾼 뒤 스크롤해도 목록이 안 뒤섞인다
- [x] **목록이 몇 장 보이는지** — 필터가 세로를 너무 먹지 않는지

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

---

# 실기기 확인 뒤에 달라진 것

Task 1~7은 계획대로 갔다. 그 뒤로 실기기로 보며 고친 것이 **커밋 스물여섯 중 스물**이다.
계획서에 없던 것이 절반이 넘으니, 왜 이렇게 됐는지를 여기 남긴다.

## 계획서가 틀렸던 곳

```
5-6  「시트가 insets.bottom 을 자기가 더한다」
     → 껍데기(ui/bottom-sheet.tsx)가 이미 더하고 있었다. 또 더하면 두 번 센다.
       판이 계획서를 그대로 안 따르고 코드를 열어본 게 맞았다.

6-3·6-5  「필터 줄은 헤더로, 툴바는 밖에 고정」
     → 그러면 툴바가 필터 줄보다 **위**로 가서 설계 §2 그림과 순서가 뒤집힌다.
       SectionList 의 섹션 헤더를 써야 「필터가 스크롤되고 툴바만 붙는」 그림이 된다.
       ⚠️ 안드로이드는 stickySectionHeadersEnabled 가 기본으로 꺼져 있다.
```

## 실기기에서만 드러난 것들

```
필터 줄이 자리를 옮김      조건을 바꿀 때마다 「불러오는 중」을 지나며 목록 헤더 안 ↔ 밖을
                          오갔다. 자리가 바뀌면 조각이 새로 태어나 접힘 애니메이션이 죽는다.
                          → 목록을 늘 그리고 빈 화면은 목록 **안쪽**에 넣는다

접힘이 260ms 로는 안 보임   「전체」로 돌아갈 때만 툭 사라졌다. 애니메이션이 안 돌아서가
                          아니라 목록 스무 장을 다시 그리는 부하에 묻혀서였다. 400ms 로.
                          ⚠️ 대분류끼리만 눌러 보면 260ms 로도 멀쩡해 보인다

툴바 알약이 깎임           가로로 미는 상자와 알약 높이가 똑같아 둥근 모서리가 경계에 닿았다.
                          ⚠️ 바깥 여백을 키워선 안 고쳐진다 — 잘라내는 건 안쪽 상자다

필터 배경이 회색           자기 배경색이 없어 홈 배경(#F9FAFB)이 비쳤다

탭 전환이 툭툭 끊김        탭마다 자기 밑줄을 켜고 껐다. 바를 **하나**로 만들어 미끄러지게.
                          자리만 옮기면 글자 길이가 달라 폭이 튀므로 너비도 함께 움직인다
```

## 하단 시트 — 여섯 바퀴

가장 오래 걸린 곳이다. 요청을 잘못 읽은 것이 두 번, 실기기에서만 드러난 것이 세 번이었다.

```
1  손잡이 + 손 따라감 + 놓으면 둘 중 하나
2  손 따라가기 제거            ← 「A처럼 말고」의 A를 잘못 짚었다
3  카카오맵식 · 아무 데서나      ← 스크롤과 매 프레임 다퉈 「내려가다 멈춤」
4  1로 되돌림
5  쓸면 곧바로 닫기            ← 손잡이에서는 잘 됨
6  아무 데서나 + 지역 2단계     ← 지금
```

**뿌리는 시트 안 스크롤이었다.** 스크롤이 있는 한 「어디를 쓸어도 닫힌다」와 계속 부딪혔다.
지역을 2단계(시/도 → 시/군/구)로 갈라 한 번에 한 목록만 보이게 하니 스크롤이 필요 없어졌고,
조율 장치도 통째로 사라졌다.

「손을 떼야 반응한다」의 원인은 셋이 겹쳐 있었다.
```
① activeOffsetY 에 [-10000, 12] 같은 극단값   → 숫자 하나로
② 「닫아라」를 화면 담당(JS)에 넘겨 기다림     → UI 담당이 직접 내린다
③ 스크롤과 겨루는 장치                        → 스크롤을 없애니 사라짐
```

## 설계와 달라진 것 (사용자와 합의)

```
대분류 탭도 고정      설계는 툴바만 고정이었다. 홈에 「맨 위로」 단추가 없어 한 번 내려가면
                     닿기 어렵고, 대분류는 계속 오가는 축이라 남겼다. 세로를 86dp 더 쓴다

카테고리에 「전체」 없음  웹 CategoryFilter.tsx 도 여덟 개만 그린다. 되돌릴 때는 다시 누른다

초기화는 즉시 반영     「적용을 눌러야 반영」에 초기화까지 묶으니 「눌렀는데 목록이 그대로」가
                     됐다. 웹도 「필터 초기화」는 즉시 반영한다(웹에는 「적용」이 없다)

지역은 2단계          시/도 17개 + 시/군/구 최대 30개를 함께 펼치면 시트가 화면을 넘는다
```

## 곁다리로 같이 고친 것

```
하단 탭바 높이 49 → 56 · 위 여백 6   당근 앱에 맞췄다
                                    ⚠️ toast-host.tsx 의 TAB_BAR_CLEARANCE 와 묶여 있다
```

시험은 312개(15바퀴 끝) → **456개**.
