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
  sellerProfileImageUrl: null
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
  imageUrl: null
  isBlocked: boolean
  blockReason: null
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
}

export interface ChatRoomsResponse {
  code: string
  message: string
  data: { chatRooms: fetchChatRoom[]; currentPage: number; totalPages: number; totalElements: number; hasNext: boolean; hasPrevious: boolean }
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
