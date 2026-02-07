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

export const createChatRoom = async (requestData: CreateChatRequestData) => {
  const response = await api.post<CreateChatRoomResponse>(`/chat/rooms`, requestData)
  return response.data.data
}

export const fetchRooms = async (page: number = 0, size: number = 10) => {
  const response = await api.get<ChatRoomsResponse>(`/chat/rooms?page=${page}&size=${size}`)
  return response.data.data
}

export const fetchRoomMessages = async (chatRoomId: number, page: number = 0, size: number = 50) => {
  const response = await api.get<ChatRoomMessagesResponse>(`/chat/rooms/${chatRoomId}/messages?page=${page}&size=${size}`)
  return response.data
}

export const outChatRoom = async (chatRoomId: number) => {
  await api.delete(`/chat/rooms/${chatRoomId}`)
}

export const uploadImage = async (files: File[]): Promise<ImageUploadResponse['data']> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  const response = await api.post<ImageUploadResponse>('/images', formData)
  return response.data.data
}

export const fetchMyPageData = async () => {
  const response = await api.get<MyPageDataResponse>(`/profile/me`)
  return response.data.data
}

export const fetchMyProductData = async (page: number = 0) => {
  const response = await api.get<MyPageProductResponse>(`/profile/me/products?page=${page}&size=10`)
  return response.data.data
}

export const fetchMyRequestData = async (page: number = 0) => {
  const response = await api.get<MyPageProductResponse>(`/profile/me/purchase-requests?page=${page}&size=10`)
  return response.data.data
}

export const fetchMyFavoriteData = async (page: number = 0) => {
  const response = await api.get<MyPageProductResponse>(`/profile/me/favorites?page=${page}&size=10`)
  return response.data.data
}

export const fetchMyBlockedData = async (page: number = 0) => {
  const response = await api.get<MyBlockedUsersResponse>(`/profile/me/blocked-users?page=${page}&size=10`)
  return response.data.data.blockedUsers
}

export const patchProductTradeStatus = async (id: number, requestData: TransactionStatus) => {
  const response = await api.patch<ProductPostResponse>(`/products/${id}/trade-status`, { tradeStatus: requestData })
  return response.data
}

export const deleteProduct = async (id: number) => {
  const response = await api.delete<ProductPostResponse>(`/products/${id}`)
  return response.data
}
