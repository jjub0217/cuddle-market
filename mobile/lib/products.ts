import type { ProductDetailItem, ProductDetailResponse, ProductResponse } from '@cuddle/shared'

import { apiFetch } from './auth/api'

// 홈 상품 목록 데이터 소스.
//
// 로그인 여부와 무관하게 볼 수 있는 화면이지만, 요청은 apiFetch로 보낸다.
// 토큰이 있으면 붙고 없으면 안 붙으므로 게스트도 그대로 볼 수 있다.
//
// 왜 토큰을 붙이나 (지난 바퀴엔 순수 fetch였다):
// 서버는 요청자를 알아야 isFavorite을 채워준다. 토큰 없이 부르면 항상 null이 와서,
// 찜을 눌러 켜진 하트가 재조회가 끝나는 순간 도로 꺼진다(실측으로 확인한 버그).
//
// 성공/오류 판정은 응답 body의 code가 아니라 HTTP status(res.ok) 기준.
// base URL 누락 가드는 apiFetch 안(apiBaseUrl)에 있다.

/** 한 번에 받아오는 개수. 웹 홈과 같다. */
const PAGE_SIZE = 20

/**
 * 목록을 좁히는 조건.
 *
 * 서버(`ProductSearchRequest`)는 12가지를 받지만 지금은 셋만 쓴다.
 * 나머지(가격·지역·상태·정렬·상세 종류)는 #855에서.
 */
export interface ProductListParams {
  /** 0부터 시작하는 페이지 번호 */
  page: number
  /** 검색어 */
  keyword?: string
  /** 반려동물 대분류 코드 */
  petType?: string
  /** 상품 카테고리 코드. 서버는 목록을 받지만 하나만 보낸다(웹과 같다) */
  categories?: string
}

/**
 * 상품 목록 한 페이지를 가져온다.
 * `GET {base}/products/search?page={page}&size=20[&keyword=…][&petType=…][&categories=…]`
 *
 * 홈과 검색 결과가 **같은 함수**를 쓴다 — 조건 하나가 다를 뿐 같은 조회이기 때문이다.
 *
 * @returns 응답의 data (무한스크롤에 content + hasNext 둘 다 필요)
 */
export async function fetchProducts({
  page,
  keyword,
  petType,
  categories,
}: ProductListParams): Promise<ProductResponse['data']> {
  const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) })

  // ⚠️ **빈 값은 아예 안 싣는다.** 알약의 「전체」는 null 이고, 그걸 'ALL' 같은 글자로
  //    보내면 서버가 그런 이름의 종류를 찾아 아무것도 안 나온다.
  //    URLSearchParams 가 한글·공백을 알아서 주소용으로 바꿔 준다.
  if (keyword) query.set('keyword', keyword)
  if (petType) query.set('petType', petType)
  if (categories) query.set('categories', categories)

  const res = await apiFetch(`/products/search?${query.toString()}`)

  if (!res.ok) {
    throw new Error(`상품 목록을 불러오지 못했어요 (HTTP ${res.status})`)
  }

  const body: ProductResponse = await res.json()
  return body.data
}

/** 없는 상품(404). 화면에서 "삭제된 상품" 안내를 띄우려고 따로 구분한다. */
export class ProductNotFoundError extends Error {
  constructor() {
    super('상품을 찾을 수 없습니다.')
    this.name = 'ProductNotFoundError'
  }
}

/**
 * 상품 한 건을 가져온다.
 * `GET {base}/products/{id}`
 * 삭제되었거나 없는 id면 서버가 404를 준다(실측).
 */
export async function fetchProductDetail(id: number): Promise<ProductDetailItem> {
  const res = await apiFetch(`/products/${id}`)

  if (res.status === 404) {
    throw new ProductNotFoundError()
  }
  if (!res.ok) {
    throw new Error(`상품을 불러오지 못했어요 (HTTP ${res.status})`)
  }

  const body: ProductDetailResponse = await res.json()
  return body.data
}

/**
 * 상품을 만들거나 고칠 때 보내는 것.
 *
 * ⚠️ 등록과 수정이 **같은 모양**이다. 수정은 PATCH지만 실제로는 전체 교체라
 *    (ProductServiceImpl:235-247) 안 바꾼 값도 전부 다시 보내야 한다.
 *    하나라도 빠지면 400이 나거나 그 값이 비워진다.
 */
export interface ProductPayload {
  petType: string
  petDetailType: string
  category: string
  title: string
  description: string
  price: number
  productStatus: string
  mainImageUrl: string | null
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
}

/**
 * 상품을 등록한다.
 * `POST {base}/products` → 201
 * @returns 만든 상품 id
 */
export async function createProduct(payload: ProductPayload): Promise<number> {
  const res = await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) })

  if (!res.ok) {
    throw new Error('상품 등록에 실패했습니다.')
  }

  const body = (await res.json()) as { data?: { id?: number } }
  const id = body.data?.id
  if (!id) {
    throw new Error('상품 등록에 실패했습니다.')
  }
  return id
}

/**
 * 상품을 고친다.
 * `PATCH {base}/products/{id}` → 200
 * ⚠️ 전체 교체다. payload에 안 담긴 값은 서버에서 비워진다.
 */
export async function updateProduct(id: number, payload: ProductPayload): Promise<void> {
  const res = await apiFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

  if (!res.ok) {
    throw new Error('상품 수정에 실패했습니다.')
  }
}

/**
 * 상품을 지운다.
 * `DELETE {base}/products/{id}` → 200 (data는 null)
 */
export async function deleteProduct(id: number): Promise<void> {
  const res = await apiFetch(`/products/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    throw new Error('상품 삭제에 실패했습니다.')
  }
}
