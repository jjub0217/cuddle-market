import type {
  DeleteResponse,
  CommentPostRequestData,
  CommentPostResponse,
  CommentResponse,
  CommunityDetailItemResponse,
  CommunityPostRequestData,
  CommunityPostResponse,
  CommunityResponse,
  ReportedRequestData,
  ReportedResponse,
} from '@/types'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
import { api } from './api'

// 커뮤니티 질문 있어요 목록 조회
export const fetchQuestionCommunity = async (
  page: number = 0,
  size: number = 10,
  searchType?: string | null,
  keyword?: string | null,
  sortBy?: string | null
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  if (searchType) {
    params.append('searchType', searchType)
  }
  if (keyword) {
    params.append('keyword', keyword)
  }
  if (sortBy) {
    params.append('sortBy', sortBy)
  }
  const response = await axios.get<CommunityResponse>(`${API_BASE_URL}/community/posts?boardType=QUESTION&${params.toString()}`)
  return response.data.data
}

// 커뮤니티 정보 공유 목록 조회
export const fetchInfoCommunity = async (
  page: number = 0,
  size: number = 10,
  searchType?: string | null,
  keyword?: string | null,
  sortBy?: string | null
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  if (searchType) {
    params.append('searchType', searchType)
  }
  if (keyword) {
    params.append('keyword', keyword)
  }
  if (sortBy) {
    params.append('sortBy', sortBy)
  }
  const response = await axios.get<CommunityResponse>(`${API_BASE_URL}/community/posts?boardType=INFO&&${params.toString()}`)
  return response.data.data
}

// 커뮤니티 글 등록
export const postCommunity = async (requestData: CommunityPostRequestData) => {
  const response = await api.post<CommunityPostResponse>(`/community/posts`, requestData)
  return response.data.data
}

// 커뮤니티 글 상세 조회
export const fetchCommunityId = async (postId: string) => {
  const response = await api.get<CommunityDetailItemResponse>(`/community/posts/${postId}`)
  return response.data.data
}

// 커뮤니티 게시글 수정
export const patchPost = async (postId: number, requestData: CommunityPostRequestData) => {
  const response = await api.patch<DeleteResponse>(`/community/posts/${postId}`, requestData)
  return response.data.data
}

// 커뮤니티 게시글 삭제
export const deletePost = async (postId: number) => {
  const response = await api.delete<DeleteResponse>(`/community/posts/${postId}`)
  return response.data.data
}

// 댓글 목록 조회
export const fetchComments = async (postId: string) => {
  const response = await api.get<CommentResponse>(`/community/posts/${postId}/comments`)
  return response.data.data
}

// 하위 댓글 목록 조회
export const fetchReplies = async (commentId: string) => {
  const response = await api.get<CommentResponse>(`/community/comments/${commentId}/replies`)
  return response.data.data
}

// 댓글 등록
export const postReply = async (requestData: CommentPostRequestData, postId: string) => {
  const response = await api.post<CommentPostResponse>(`/community/posts/${postId}/comments`, requestData)
  return response.data.data
}

// 댓글 삭제
export const deleteReply = async (commentId: number) => {
  const response = await api.delete<DeleteResponse>(`community/comments/${commentId}`)
  return response.data.data
}

// 커뮤니티 게시글 신고
export const postReported = async (postId: number, requestData: ReportedRequestData) => {
  const response = await api.post<ReportedResponse>(`/reports/community-posts/${postId}`, requestData)
  return response.data.data
}

// 상품 상세 조회
// api를 사용하면 자동으로:
// 1. Authorization 헤더에 access token 추가
// 2. 401 에러 시 토큰 갱신 후 재요청
// export const fetchProductById = async (productId: string) => {
//   const response = await api.get<ProductDetailItemResponse>(`/products/${productId}`)
//   return response.data.data
// }

// // 찜 추가
// export const addFavorite = async (productId: number): Promise<void> => {
//   await api.post(`/products/${productId}/favorite`)
// }

// // 판매 상품 등록
// export const postProduct = async (requestData: ProductPostRequestData): Promise<void> => {
//   await api.post(`/products`, requestData)
// }

// // 판매요청 상품 등록
// export const requestPostProduct = async (requestData: RequestProductPostRequestData): Promise<void> => {
//   await api.post(`/products/requests`, requestData)
// }

// // 이미지 업로드
// export const uploadImage = async (files: File[]): Promise<ImageUploadResponse['data']> => {
//   const formData = new FormData()

//   files.forEach((file) => {
//     formData.append('files', file)
//   })
//   // FormData를 전달하면 axios가 자동으로 Content-Type: multipart/form-data를 설정함
//   const response = await api.post<ImageUploadResponse>('/images', formData)
//   return response.data.data
// }

// // 마이페이지 조회
// export const fetchMyPageData = async () => {
//   const response = await api.get<MyPageDataResponse>(`/profile/me`)
//   return response.data.data
// }

// // 내가 등록한 판매상품 조회
// export const fetchMyProductData = async (page: number = 0) => {
//   const response = await api.get<MyPageProductResponse>(`/profile/me/products?page=${page}&size=10`)
//   return response.data.data
// }

// // 내가 등록한 판매요청 상품 조회
// export const fetchMyRequestData = async (page: number = 0) => {
//   const response = await api.get<MyPageProductResponse>(`/profile/me/purchase-requests?page=${page}&size=10`)
//   return response.data.data
// }

// // 내가 찜한 상품 조회
// export const fetchMyFavoriteData = async (page: number = 0) => {
//   const response = await api.get<MyPageProductResponse>(`/profile/me/favorites?page=${page}&size=10`)
//   return response.data.data
// }

// // 내가 차단한 유저 조회
// export const fetchMyBlockedData = async (page: number = 0) => {
//   const response = await api.get<MyBlockedUsersResponse>(`/profile/me/blocked-users?page=${page}&size=10`)
//   return response.data.data.blockedUsers
// }

// // 상품 거래상태 변경
// export const patchProductTradeStatus = async (id: number, requestData: TransactionStatus) => {
//   const response = await api.patch<ProductPostResponse>(`/products/${id}/trade-status`, { tradeStatus: requestData })
//   return response.data
// }

// export const deleteProduct = async (id: number) => {
//   const response = await api.delete<ProductPostResponse>(`/products/${id}`)
//   return response.data
// }
