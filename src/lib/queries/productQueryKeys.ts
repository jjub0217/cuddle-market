export interface ProductSearchParams {
  petType?: string | null
  productType?: string | null
  petDetailType?: string | null
  categories?: string | null
  productStatuses?: string | null
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
export function productListQueryKey(params: ProductSearchParams) {
  return [
    'products',
    params.petType || null,
    params.productType || null,
    params.petDetailType || null,
    params.categories || null,
    params.productStatuses || null,
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
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
    addressSido: get('addressSido'),
    addressGugun: get('addressGugun'),
    keyword: get('keyword'),
    sortBy: get('sortBy'),
    sortOrder: get('sortOrder'),
  }
}
