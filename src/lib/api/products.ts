import type {
  ImageUploadResponse,
  // FilterApiResponse,
  MyBlockedUsersResponse,
  MyPageDataResponse,
  MyPageProductResponse,
  ProductDetailItemResponse,
  ProductPostRequestData,
  ProductPostResponse,
  ProductResponse,
  RequestProductPostRequestData,
} from '@/types'
import { api } from './api'
import type { TransactionStatus } from '@/constants/constants'

// 상품 목록 조회
export const fetchAllProducts = async (
  page: number = 0,
  size: number = 20,
  productType?: string,
  selectedProductStatus?: string | null,
  minPrice?: number | null,
  maxPrice?: number | null,
  addressSido?: string | null,
  addressGugun?: string | null,
  selectedCategory?: string | null,
  petType?: string | null,
  selectedDetailPet?: string | null,
  keyword?: string | null,
  sortBy?: string | null,
  sortOrder?: string | null
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })

  if (keyword) {
    params.append('keyword', keyword)
  }
  if (petType) {
    params.append('petType', petType)
  }
  if (selectedDetailPet) {
    params.append('petDetailType', selectedDetailPet)
  }
  if (productType) {
    params.append('productType', productType)
  }

  if (selectedProductStatus) {
    params.append('productStatuses', selectedProductStatus)
  }

  if (minPrice !== null && minPrice !== undefined) {
    params.append('minPrice', minPrice.toString())
  }

  if (maxPrice !== null && maxPrice !== undefined) {
    params.append('maxPrice', maxPrice.toString())
  }

  if (addressSido) {
    params.append('addressSido', addressSido)
  }

  if (addressGugun) {
    params.append('addressGugun', addressGugun)
  }
  if (selectedCategory) {
    params.append('categories', selectedCategory)
  }
  if (sortBy) {
    params.append('sortBy', sortBy)
  }
  if (sortOrder) {
    params.append('sortOrder', sortOrder)
  }

  const response = await api.get<ProductResponse>(`/products/search?${params.toString()}`)

  return {
    data: response.data,
    total: response.data.data.totalElements,
  }
}

// 상품 상세 조회
// api를 사용하면 자동으로:
// 1. Authorization 헤더에 access token 추가
// 2. 401 에러 시 토큰 갱신 후 재요청
export const fetchProductById = async (productId: string) => {
  const response = await api.get<ProductDetailItemResponse>(`/products/${productId}`)
  return response.data.data
}

// 찜 추가
export const addFavorite = async (productId: number): Promise<void> => {
  await api.post(`/products/${productId}/favorite`)
}

// 판매 상품 등록
export const postProduct = async (requestData: ProductPostRequestData): Promise<ProductPostResponse> => {
  const response = await api.post<{ data: ProductPostResponse }>(`/products`, requestData)
  return response.data.data
}

// 판매요청 상품 등록
export const requestPostProduct = async (requestData: RequestProductPostRequestData): Promise<ProductPostResponse> => {
  const response = await api.post<{ data: ProductPostResponse }>(`/products/requests`, requestData)
  return response.data.data
}

// 판매 상품 수정
export const patchProduct = async (requestData: ProductPostRequestData, id: number): Promise<ProductPostResponse> => {
  const response = await api.patch<{ data: ProductPostResponse }>(`/products/${id}`, requestData)
  return response.data.data
}

// 판매요청 상품 수정
export const patchRequestProduct = async (requestData: RequestProductPostRequestData, id: number): Promise<ProductPostResponse> => {
  const response = await api.patch<{ data: ProductPostResponse }>(`/products/requests/${id}`, requestData)
  return response.data.data
}

// 이미지 업로드
export const uploadImage = async (files: File[]): Promise<ImageUploadResponse['data']> => {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })
  // FormData를 전달하면 axios가 자동으로 Content-Type: multipart/form-data를 설정함
  const response = await api.post<ImageUploadResponse>('/images', formData)
  return response.data.data
}

// 마이페이지 조회
export const fetchMyPageData = async () => {
  const response = await api.get<MyPageDataResponse>(`/profile/me`)
  return response.data.data
}

// 내가 등록한 판매상품 조회
export const fetchMyProductData = async (page: number = 0) => {
  const response = await api.get<MyPageProductResponse>(`/profile/me/products?page=${page}&size=10`)
  return response.data.data
}

// 내가 등록한 판매요청 상품 조회
export const fetchMyRequestData = async (page: number = 0) => {
  const response = await api.get<MyPageProductResponse>(`/profile/me/purchase-requests?page=${page}&size=10`)
  return response.data.data
}

// 내가 찜한 상품 조회
export const fetchMyFavoriteData = async (page: number = 0) => {
  const response = await api.get<MyPageProductResponse>(`/profile/me/favorites?page=${page}&size=10`)
  return response.data.data
}

// 내가 차단한 유저 조회
export const fetchMyBlockedData = async (page: number = 0) => {
  const response = await api.get<MyBlockedUsersResponse>(`/profile/me/blocked-users?page=${page}&size=10`)
  return response.data.data.blockedUsers
}

// 상품 거래상태 변경
export const patchProductTradeStatus = async (id: number, requestData: TransactionStatus) => {
  const response = await api.patch<ProductPostResponse>(`/products/${id}/trade-status`, { tradeStatus: requestData })
  return response.data
}

export const deleteProduct = async (id: number) => {
  const response = await api.delete<ProductPostResponse>(`/products/${id}`)
  return response.data
}
