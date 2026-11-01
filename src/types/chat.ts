// ========== 채팅 관련 타입 ==========
export interface CreateChatRequestData {
  productId: number
}

export interface ChatRoom {
  chatRoomId: number
  productId: number
  productTitle: string
  productPrice: number
  productImageUrl: string
  createdAt: string
  sellerNickname: string
  sellerProfileImageUrl: string | null
}

export interface CreateChatRoomResponse {
  code: string
  message: string
  data: ChatRoom
}

export interface Message {
  messageId: number
  senderId: number
  senderNickname: string
  messageType: string
  content: string
  imageUrl: string | null
  isBlocked: boolean
  blockReason: string | null
  createdAt: string
  isMine: boolean
}

export interface ChatRoomMessagesResponse {
  code: string
  message: string
  data: {
    messages: Message[]
  }
  currentPage: number
  totalPages: number
  totalElements: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface fetchChatRoom {
  chatRoomId: number
  productId: number
  productTitle: string
  productPrice: number
  productImageUrl: string
  opponentId: number
  opponentNickname: string
  opponentProfileImageUrl: string
  lastMessage: string
  lastMessageTime: string
  hasUnread: boolean
  unreadCount: number
  /** 내가 이 방의 상대를 차단했는가. 참이면 입력창을 잠근다(#877). */
  isOpponentBlocked: boolean
  /** 이 방이 지금 열려 있는지 (#1126). 열림이 아니면 입력칸 대신 안내를 보인다 */
  roomState?: ChatRoomState
  /** 지금 보는 사람이 이 방에서 결제할 수 있는가 (#1126). 예약자 본인만 참 */
  canPay?: boolean
}

export type ChatRoomState = 'OPEN' | 'PAUSED_RESERVED' | 'CLOSED_SOLD' | 'CLOSED_DONE'

export interface ChatRoomsResponse {
  code: string
  message: string
  data: {
    chatRooms: fetchChatRoom[]
  }
  currentPage: number
  totalPages: number
  totalElements: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ChatRoomUpdateResponse {
  chatRoomId: number
  productId: number
  productTitle: string
  productPrice: number
  productImageUrl: string
  opponentId: number
  opponentNickname: string
  opponentProfileImageUrl: string
  lastMessage: string
  lastMessageTime: string
  hasUnread: boolean
  unreadCount: number
}
