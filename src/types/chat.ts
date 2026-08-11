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
}

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
