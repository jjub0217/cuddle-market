// Cuddle Market 웹·앱 공유 상품 타입.
// 웹 `src/types/product.ts`에서 "홈 목록 슬라이스"에 필요한 부분만 옮겼다.
// (로그인/상세용 타입 — LoginResponse, ProductDetailItem 등 — 은 해당 기능 구현 때 추가한다.)

export interface Product {
  id: number
  productType: string
  tradeStatus: string | null
  petType?: string
  petDetailType: string
  productStatus: string
  title: string
  price: number
  mainImageUrl: string
  createdAt: string
  favoriteCount: number
  isFavorite: boolean | null
  viewCount?: number
  addressSido?: string
  addressGugun?: string
}

export interface ProductResponse {
  // 라이브 검증(2026-07-21): 실제 응답의 `code`는 문자열 "SUCCESS".
  // 웹 원본 타입은 `{ code: number; message: string }` 객체로 잘못 선언돼 있었으나,
  // 실제 응답에 맞춰 string으로 둔다. (성공/오류 판정은 HTTP status 기준.)
  code: string
  message: string
  data: {
    page: number
    size: number
    total: number
    content: Product[]
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
    totalElements: number
    numberOfElements: number
  }
}

/** 판매자 정보. 프로필 이미지와 지역은 비어 있을 수 있다(실측). */
export interface SellerInfo {
  sellerId: number
  sellerNickname: string
  sellerProfileImageUrl: string | null
  addressSido: string | null
  addressGugun: string | null
}

/**
 * 상품 상세 응답(`GET /products/{id}`의 data).
 * 라이브 검증(2026-07-23): 비로그인 200, code는 문자열 "SUCCESS".
 */
export interface ProductDetailItem extends Product {
  category: string
  description: string
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
  viewCount: number
  // 비로그인으로 조회하면 false가 아니라 null이 온다(실측).
  isFavorite: boolean | null
  sellerInfo: SellerInfo
  sellerOtherProducts: Product[]
}

export interface ProductDetailResponse {
  code: string
  message: string
  data: ProductDetailItem
}
