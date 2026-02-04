import type {
  ChatRoomMessagesResponse,
  ChatRoomsResponse,
  CreateChatRequestData,
  CreateChatRoomResponse,
  ImageUploadResponse,
  MyBlockedUsersResponse,
  MyPageDataResponse,
  MyPageProductResponse,
  ProductPostResponse,
} from '@/types'
import { api } from './api'
import type { TransactionStatus } from '@/constants/constants'

// 채팅방 생성
export const createChatRoom = async (requestData: CreateChatRequestData) => {
  const response = await api.post<CreateChatRoomResponse>(`/chat/rooms`, requestData)
  return response.data.data
}

// 채팅 목록 조회
export const fetchRooms = async (page: number = 0, size: number = 10) => {
  const response = await api.get<ChatRoomsResponse>(`/chat/rooms?page=${page}&size=${size}`)
  return response.data.data
}

// 채팅 내역 조회
export const fetchRoomMessages = async (chatRoomId: number, page: number = 0, size: number = 50) => {
  const response = await api.get<ChatRoomMessagesResponse>(`/chat/rooms/${chatRoomId}/messages?page=${page}&size=${size}`)
  return response.data
}

// 채팅방 나가기
export const outChatRoom = async (chatRoomId: number) => {
  await api.delete(`/chat/rooms/${chatRoomId}`)
}

// 채팅방 목록 실시간 업데이트 이벤트
export const updateChatRoomInList = () => {}
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
