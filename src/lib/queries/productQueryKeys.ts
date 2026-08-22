export interface ProductSearchParams {
  petType?: string | null
  productType?: string | null
  petDetailType?: string | null
  categories?: string | null
  productStatuses?: string | null
  /** 거래 상태. 「판매중」 토글이 켜지면 `SELLING` — 서버가 NULL(판매요청)도 같이 준다(#1009) */
  tradeStatuses?: string | null
  minPrice?: string | null
  maxPrice?: string | null
  addressSido?: string | null
  addressGugun?: string | null
  keyword?: string | null
  sortBy?: string | null
  sortOrder?: string | null
}

/**
 * 서버(page.tsx)와 클라이언트(Home.tsx)에서 동일한 쿼리 키를 생성하는 공유 함수.
 * 모든 값은 primitive (string | null) — 객체 없음, 탭 ID 없음.
 * 배열 첫 요소 'products'로 기존 invalidateQueries 호환 유지.
 */
/**
 * 목록을 **누가** 보는가. 열쇠에 같이 넣는다.
 *
 * ⚠️ 서버는 **내가 차단한 사람의 상품을 빼 준다**(백엔드 `SearchServiceImpl` #809).
 *    즉 **같은 조건이라도 사람마다 결과가 다르다.** 그런데 SSR(`lib/api/server/products.ts`)은
 *    토큰을 안 붙이고 `revalidate: 60` 으로 응답을 **모두에게 공유**한다 — 늘 「비로그인이 볼
 *    목록」이다.
 *
 *    열쇠를 안 가르면 로그인 사용자가 그 비로그인 값을 그대로 물고 있게 된다. 실제로 61개로
 *    보이다가 조건을 하나 바꾸면 13개로 뛰었다(2026-08-22).
 *
 * ⚠️ **`staleTime` 으로는 못 고친다.** 로그인 여부는 저장소가 물을 먹은 뒤(`_hasHydrated`)에야
 *    참이 되는데, 질의는 그보다 **먼저** 붙는다. 붙은 뒤에 `staleTime` 을 0 으로 바꿔도
 *    리액트 쿼리는 그것만으로 다시 받지 않는다(창 포커스도 꺼 두었다). **열쇠가 바뀌어야**
 *    반드시 다시 받는다.
 */
export type ProductListViewer = 'anon' | 'me'

export function productListQueryKey(params: ProductSearchParams, viewer: ProductListViewer = 'anon') {
  return [
    'products',
    viewer,
    params.petType || null,
    params.productType || null,
    params.petDetailType || null,
    params.categories || null,
    params.productStatuses || null,
    params.tradeStatuses || null,
    params.minPrice || null,
    params.maxPrice || null,
    params.addressSido || null,
    params.addressGugun || null,
    params.keyword || null,
    params.sortBy || null,
    params.sortOrder || null,
  ] as const
}

/**
 * URLSearchParams (클라이언트) 또는 plain object (서버 searchParams)에서
 * ProductSearchParams를 추출하는 유틸리티.
 */
export function extractProductSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ProductSearchParams {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key)
    }
    const val = searchParams[key]
    return typeof val === 'string' ? val : null
  }

  return {
    petType: get('petType'),
    productType: get('productType'),
    petDetailType: get('petDetailType'),
    categories: get('categories'),
    productStatuses: get('productStatuses'),
    tradeStatuses: get('tradeStatuses'),
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
    addressSido: get('addressSido'),
    addressGugun: get('addressGugun'),
    keyword: get('keyword'),
    sortBy: get('sortBy'),
    sortOrder: get('sortOrder'),
  }
}
