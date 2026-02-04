// ========== 알림 관련 타입 ==========
export interface NotificationsDataResponse {
  code: {
    code: number
    message: string
  }
  message: string
  data: {
    page: number
    size: number
    total: number
    content: NotificationItem[]
    totalPages: 8
    hasNext: boolean
    hasPrevious: boolean
    totalElements: number
    numberOfElements: number
  }
}
export interface NotificationItem {
  notificationId: number
  notificationType: string
  title: string
  content: string
  relatedEntityType: string
  relatedEntityId: number
  isRead: boolean
  readAt: null
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
