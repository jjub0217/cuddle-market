// ========== 알림 관련 타입 ==========
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
  CHAT = 'CHAT',
  COMMENT = 'COMMENT',
  PRODUCT = 'PRODUCT',
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  SYSTEM = 'SYSTEM',
}

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
