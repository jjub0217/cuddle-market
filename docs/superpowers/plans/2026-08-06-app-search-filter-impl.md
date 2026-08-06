# 앱 검색 · 필터 구현 계획 (#854)

> 설계: `docs/superpowers/specs/2026-08-06-app-search-filter-design.md`
> 브랜치: `feature/854--app-search-filter`
> 다음 바퀴(세부 필터): `#855`

## 못 박아 둘 것 — 조각들이 주고받는 모양

이걸 먼저 정해야 뒤 작업이 어긋나지 않는다.

```ts
// mobile/lib/products.ts
export interface ProductListParams {
  page: number;
  keyword?: string;      // 검색어
  petType?: string;      // 반려동물 대분류 코드
  categories?: string;   // 카테고리 코드 (서버는 목록을 받지만 하나만 보낸다)
}
export function fetchProducts(params: ProductListParams): Promise<ProductResponse['data']>

// mobile/components/products/product-filter-row.tsx
interface Props {
  petType: string | null;
  category: string | null;
  onChangePetType: (next: string | null) => void;
  onChangeCategory: (next: string | null) => void;
}

// mobile/components/products/product-list-view.tsx
interface Props {
  keyword?: string;       // 있으면 검색 결과, 없으면 홈
  bottomInset?: number;   // 떠 있는 단추 자리. 홈에서만 준다
}
```

⚠️ **필터 상태는 조각 안에 둔다.** 그래야 홈과 결과 화면이 **각자의 필터**를 갖는다 —
검색하고 뒤로 왔을 때 홈에서 고른 것이 그대로 남는다(설계 §3).

---

## Task 1: 조회 함수가 조건을 받게 한다

**파일**
- 고침: `mobile/lib/products.ts`
- 고침: `mobile/app/(tabs)/(home)/index.tsx` (부르는 자리)
- 만듦: `mobile/lib/products.test.ts` (없으면)

- [ ] **1-1.** 시험 먼저. 조건이 쿼리에 실리는지, **없으면 아예 안 실리는지**

```ts
it('조건이 없으면 page·size 만 보낸다', async () => { … })
it('검색어·대분류·카테고리를 쿼리에 싣는다', async () => { … })
it('빈 문자열은 안 싣는다', async () => { … })   // 「전체」가 이 경우다
```

- [ ] **1-2.** `fetchProducts(page)` → `fetchProducts(params)` 로 바꾼다.
      ⚠️ 부르는 자리(홈)도 같이 고친다. 안 그러면 홈이 깨진다.
- [ ] **1-3.** ⚠️ **「전체」는 빈 값이다.** `'ALL'` 같은 글자를 보내면 서버가 그런 종류를 찾는다.
      값이 `null`·`''` 이면 쿼리에서 **빼야** 한다.
- [ ] **1-4.** `npx jest lib/products` · 홈이 전과 같이 도는지 눈으로
- [ ] **1-5.** 커밋

---

## Task 2: 홈의 목록을 조각으로 빼낸다 (기능 변화 0)

**이 단계에서 눈에 보이는 변화가 없어야 한다. 그게 확인 방법이다.**

**파일**
- 만듦: `mobile/components/products/product-list-view.tsx`
- 만듦: `mobile/components/products/product-list-view.test.tsx`
- 고침: `mobile/app/(tabs)/(home)/index.tsx`

- [ ] **2-1.** 조각으로 옮길 것 — `useInfiniteQuery` · `HomeRow` · 3상태(로딩·오류·빈) ·
      `FlatList` · `onEndReached` · `ListFooter`
- [ ] **2-2.** 화면에 남길 것 — `SafeAreaView` · `AppHeader` · **떠 있는 「상품 등록」 단추**
      ⚠️ 단추는 로그인했을 때만 보이고, 그만큼 목록 아래를 비운다. 그 값을 `bottomInset` 으로 넘긴다.
      게스트에겐 안 비운다 — 늘 비우면 목록 끝이 허전하게 뚫린다(2026-08-04에 잡은 것).
- [ ] **2-3.** 시험 — 목록이 나온다 · 로딩 · 오류 + 다시 시도 · 빈 화면
- [ ] **2-4.** `pnpm gate:mobile`
- [ ] **2-5.** **실기기에서 홈이 전과 똑같은지** 확인 (무한스크롤 · 찜 · 단추 자리)
- [ ] **2-6.** 커밋

---

## Task 3: 필터 줄

**파일**
- 만듦: `mobile/components/products/product-filter-row.tsx`
- 만듦: `mobile/components/products/product-filter-row.test.tsx`

- [ ] **3-1.** 선택지는 **`@cuddle/shared` 에서 가져온다** — `PET_TYPE_OPTIONS`(9) ·
      `CATEGORY_OPTIONS`(8). 새로 적지 마라.
- [ ] **3-2.** 줄 둘. 각각 가로 스크롤. 맨 앞에 **「전체」**(값은 `null`).
- [ ] **3-3.** 하나만 고른다. **같은 것을 다시 누르면 풀린다**(웹과 같다).
- [ ] **3-4.** ⚠️ 색·모양을 새로 짓지 마라. `components/places/category-tabs.tsx` 가
      같은 알약이다 — 그 값을 그대로 쓴다.
- [ ] **3-5.** ⚠️ **잘린 게 보이게** 오른쪽 끝에 여백을 준다. 딱 맞으면 뒤에 더 있는 걸 모른다.
- [ ] **3-6.** 시험 — 고르면 알린다 · 다시 누르면 `null` 로 알린다 · 「전체」가 맨 앞이다
- [ ] **3-7.** 커밋

---

## Task 4: 조각에 필터를 붙인다

**파일**
- 고침: `mobile/components/products/product-list-view.tsx`

- [ ] **4-1.** 조각 안에 `petType`·`category` 상태를 둔다. 맨 위에 `ProductFilterRow`.
- [ ] **4-2.** ⚠️ **조건이 바뀌면 목록을 처음부터 받는다.** `queryKey` 에 조건을 넣는다.
      안 넣으면 필터를 바꿔도 2페이지부터 이어 받아 **뒤섞인 목록**이 된다.

```ts
queryKey: ['products', { keyword, petType, category }]
```

- [ ] **4-3.** 시험 — 필터를 바꾸면 그 조건으로 다시 부른다
- [ ] **4-4.** `pnpm gate:mobile` · 실기기에서 필터가 도는지
- [ ] **4-5.** 커밋

---

## Task 5: 검색 화면

**파일**
- 만듦: `mobile/app/search.tsx`
- 고침: `mobile/app/_layout.tsx` (화면 등록)
- 고침: `mobile/app/(tabs)/(home)/index.tsx` (헤더에 돋보기)

- [ ] **5-1.** 헤더 오른쪽에 돋보기. `AppHeader` 의 `right` 자리를 쓴다.
      ⚠️ 알림 벨이 이미 거기 있는지 확인하고, 있으면 나란히 둔다.
- [ ] **5-2.** 검색 화면 — `ScreenHeader`(뒤로) + 입력칸 하나. 들어오면 **바로 초점**.
      문구는 웹과 같다: **「원하는 반려동물 용품을 검색해보세요」**
- [ ] **5-3.** 넣으면 결과 화면으로. ⚠️ **빈 검색어면 넘어가지 않는다** — 홈과 같아진다.
- [ ] **5-4.** ⚠️ `_layout.tsx` 에 등록하는 걸 빠뜨리지 마라 — 네이티브 헤더가 라우트 이름을
      그대로 띄운다(#805·#838에서 겪었다). 지금은 `screenOptions` 로 통째로 꺼 두었으니
      **추가만** 하면 된다.
- [ ] **5-5.** 커밋

---

## Task 6: 결과 화면

**파일**
- 만듦: `mobile/app/search-result.tsx`
- 고침: `mobile/app/_layout.tsx`

- [ ] **6-1.** `useLocalSearchParams` 로 검색어를 받아 `<ProductListView keyword={...} />`
      **그게 전부다.** 필터는 조각 안에 있어 저절로 따라온다.
- [ ] **6-2.** 헤더에 **검색어를 제목으로** 보여준다. 누르면 검색 화면으로 되돌아간다(고치기).
- [ ] **6-3.** 커밋

---

## Task 7: 실기기 확인

게이트가 초록이어도 따로 봐야 한다.

- [ ] 홈이 **전과 똑같다** (무한스크롤 · 찜 · 「상품 등록」 단추 자리)
- [ ] 알약 두 줄이 목록을 너무 아래로 밀지 않는다 — **목록이 몇 개나 보이는지**
- [ ] 알약을 고르면 목록이 바뀌고, 다시 누르면 풀린다
- [ ] 알약이 **잘려 보인다** (뒤에 더 있는 걸 알 수 있다)
- [ ] 돋보기 → 검색 → 결과. 결과에서도 알약이 돈다
- [ ] **뒤로 오면 홈의 필터가 그대로** 남아 있다
- [ ] 필터를 바꾼 뒤 스크롤해도 목록이 안 뒤섞인다

---

## 함정 (설계 §8 요약)

```
홈 회귀        Task 2 에서 눈에 보이는 변화가 없어야 한다
「전체」        서버에 **빈 값**을 보낸다. 'ALL' 을 보내면 안 된다
조건 바뀜       queryKey 에 조건을 넣어 **처음부터** 받는다
빈 검색어       넘어가지 않는다
잘린 알약       오른쪽 여백으로 「더 있다」를 보여준다
화면 등록       _layout.tsx 에 추가하는 걸 빠뜨리지 마라
```
