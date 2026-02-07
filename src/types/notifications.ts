// ========== 알림 관련 타입 ==========

export interface NotificationItem {
  notificationId: number
  notificationType: NotificationType
  title: string
  content: string
  relatedEntityType: string
  relatedEntityId: number
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationsDataResponse {
  code: {
    code: string
    message: string
  }
  message: string
  data: {
    page: number
    size: number
    total: number
    content: NotificationItem[]
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
    totalElements: number
    numberOfElements: number
  }
}

export enum NotificationType {
  CHAT_NEW_ROOM = 'CHAT_NEW_ROOM',
  CHAT_NEW_MESSAGE = 'CHAT_NEW_MESSAGE',
  PRODUCT_FAVORITE_STATUS_CHANGED = 'PRODUCT_FAVORITE_STATUS_CHANGED',
  PRODUCT_FAVORITE_PRICE_CHANGED = 'PRODUCT_FAVORITE_PRICE_CHANGED',
  ADMIN_SANCTION = 'ADMIN_SANCTION',
  POST_DELETED = 'POST_DELETED',
  COMMENT_REPLY = 'COMMENT_REPLY',
  POST_COMMENT = 'POST_COMMENT',
}

export interface NotificationsPatchResponse {
  code: string
  message: string
  data: null
}

export interface NotificationsUnReadCountResponse {
  code: string
  message: string
  data: {
    unreadCount: number
  }
}
