// ========== 상품 관련 타입 ==========
export interface Product {
  id: number
  productType: string
  tradeStatus: string
  petType?: string
  petDetailType: string
  productStatus: string
  title: string
  price: number
  mainImageUrl: string
  createdAt: string
  favoriteCount: number
  isFavorite: boolean
  viewCount?: number
}

export interface ProductResponse {
  code: {
    code: number
    message: string
  }
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

export interface ProductDetailItem extends Product {
  category: string
  description: string
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
  viewCount: number
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
  }
  sellerOtherProducts: Product[]
}

export interface ProductDetailItemResponse {
  code: string
  message: string
  data: ProductDetailItem
}

// ========== 상품 등록 요청 타입 ==========
export interface ProductPostRequestData {
  petType: string
  petDetailType: string
  category: string
  title: string
  description: string
  price: number
  productStatus: string
  mainImageUrl: string
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
}

export interface ProductPostResponse {
  id: number
  sellerId: number
  productType: string
  petType: string
  petDetailType: string
  category: string
  title: string
  description: string
  price: number
  productStatus: string
  tradeStatus: string
  mainImageUrl: string
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
  viewCount: number
  favoriteCount: number
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface RequestProductPostRequestData {
  petType: string
  petDetailType: string
  category: string
  title: string
  description: string
  desiredPrice: number
  mainImageUrl: string
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
}

export interface ImageUploadResponse {
  code: { code: number; message: string }
  message: string
  data: {
    imageUrls: string[]
    mainImageUrl: string
    subImageUrls: string[]
  }
}

// ========== 마이페이지 상품 타입 ==========
export interface MyPageProductResponse {
  code: { code: number; message: string }
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

export interface UserProductResponse {
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
