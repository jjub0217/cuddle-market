import { api } from './api'

// 예약 상대 고르기 (#1126). 판매자 본인만 부를 수 있다.

export type ChatPartner = {
  userId: number
  nickname: string
  profileImageUrl: string | null
  lastMessageAt: string | null
}

/** 이 상품으로 채팅한 상대. 닉네임·사진은 채팅방에 저장된 값이라 채팅 목록과 같다 */
export async function fetchChatPartners(productId: number): Promise<ChatPartner[]> {
  const response = await api.get(`/products/${productId}/chat-partners`)
  return response.data.data ?? []
}

export async function reserveProduct(productId: number, buyerId: number): Promise<void> {
  await api.post(`/products/${productId}/reservation`, { buyerId })
}
