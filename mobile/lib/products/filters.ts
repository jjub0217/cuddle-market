import type { ProductListParams } from '../products'

// 목록을 좁히는 조건 한 덩어리.
//
// 조건이 여덟 개로 늘어나 하나씩 넘기면 손이 많이 간다. 그래서 **한 덩어리**로 다닌다.
// 화면(필터 줄·툴바·시트)은 이 모양의 일부만 고치고, 서버로 보내는 일은 여기서 한 번에 한다.
//
// ⚠️ **「전체」는 null 이다.** 'ALL' 같은 글자를 보내면 서버가 그런 이름의 종류를 찾아
//    아무것도 안 나온다 (15바퀴에서 정한 규칙).

/** 화면들이 함께 쓰는 조건 모양. 안 고른 것은 전부 null */
export interface ProductFilters {
  /** 반려동물 대분류 */
  petType: string | null
  /** 반려동물 소분류. 대분류를 바꾸면 풀어야 한다 */
  petDetailType: string | null
  /** 상품 카테고리 */
  category: string | null
  /** SELL(판매) | REQUEST(판매요청) */
  productType: string | null
  /** 상품 상태 */
  productStatus: string | null
  /**
   * 거래 상태. 「판매중」 토글이 켜지면 `SELLING`, 꺼지면 null 이다.
   *
   * ⚠️ **시트의 `productStatus`(새것·사용감 있음)와 다른 축이다.** 이건 「팔렸는가」다.
   * ⚠️ `SELLING` 을 물으면 거래 상태가 **NULL 인 것(판매요청)도 함께 온다.**
   *    서버가 그렇게 만들어져 있다(백엔드 `ProductRepositoryCustomImpl:100-106`).
   *    앱에서 또 거르지 마라 — 20개를 달라고 했는데 6개만 남는 일이 생긴다.
   */
  tradeStatus: string | null
  /** 가격 구간. 위 끝이 없는 구간(10만원 이상)은 max 가 null */
  price: { min: number; max: number | null } | null
  /** 지역 시/도 */
  sido: string | null
  /** 지역 시/군/구. 시/도를 바꾸면 풀어야 한다 */
  gugun: string | null
  /** 웹 SORT_TYPE 의 id. 기본은 최신순 */
  sortBy: string
}

/** 아무것도 안 고른 상태. `reset()` 도 이걸로 되돌린다 */
export const EMPTY_FILTERS: ProductFilters = {
  petType: null,
  petDetailType: null,
  category: null,
  productType: null,
  productStatus: null,
  tradeStatus: null,
  price: null,
  sido: null,
  gugun: null,
  sortBy: 'createdAt',
}

/**
 * 정렬 id 를 서버가 받는 모양으로 바꾸는 표.
 *
 * ⚠️ **웹의 id 와 서버가 받는 값이 다르다.** 웹은 저가/고가를 각각 다른 id 로 두지만,
 *    서버는 `sortBy=price` 에 `sortOrder` 를 붙여 방향을 정한다.
 *    근거: 웹 `ProductsSection.tsx` 의 `handleSortChange`.
 */
const SORT_PARAMS: Readonly<Record<string, { sortBy: string; sortOrder: string }>> = {
  orderedLowPriced: { sortBy: 'price', sortOrder: 'asc' },
  orderedHighPriced: { sortBy: 'price', sortOrder: 'desc' },
}

/**
 * 「판매중만 보기」가 켜졌을 때 보내는 값.
 *
 * 화면에서 글자를 다시 적지 않게 여기에 둔다 — 보내는 값과 한 곳에 있어야
 * 나중에 서버 값이 바뀌어도 한 군데만 고친다.
 */
export const SELLING = 'SELLING'

/**
 * 조건을 서버가 받는 모양으로 바꾼다. **빈 값은 아예 키를 안 만든다.**
 *
 * 키를 만들고 값만 undefined 로 두면 `fetchProducts` 쪽 가드에는 걸리지만,
 * 시험에서 「없다」를 증명하기 어려워진다. 처음부터 안 넣는다.
 */
export function toParams(f: ProductFilters, page: number, keyword?: string): ProductListParams {
  // 표에 없는 id(최신순·찜 많은 순)는 그대로 sortBy 로 간다 — 웹의 default 분기와 같다.
  const sort = SORT_PARAMS[f.sortBy] ?? { sortBy: f.sortBy }

  return {
    page,
    ...(keyword ? { keyword } : {}),
    ...(f.petType ? { petType: f.petType } : {}),
    ...(f.petDetailType ? { petDetailType: f.petDetailType } : {}),
    ...(f.category ? { categories: f.category } : {}),
    ...(f.productType ? { productType: f.productType } : {}),
    ...(f.productStatus ? { productStatuses: f.productStatus } : {}),
    ...(f.tradeStatus ? { tradeStatuses: f.tradeStatus } : {}),
    // ⚠️ 가격은 **숫자**다. 0 은 거짓값이라 `if (값)` 으로 거르면 「0원부터」가 사라진다.
    //    구간을 골랐는지(price 가 null 인지)로 판단한다.
    ...(f.price ? { minPrice: f.price.min } : {}),
    ...(f.price && f.price.max !== null ? { maxPrice: f.price.max } : {}),
    ...(f.sido ? { addressSido: f.sido } : {}),
    ...(f.gugun ? { addressGugun: f.gugun } : {}),
    ...sort,
  }
}
