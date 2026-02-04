import type { NotificationsDataResponse, NotificationsPatchResponse, NotificationsUnReadCountResponse } from '@/types/notifications'
import { api } from './api'

// 알림 목록 조회
export const fetchNotifications = async (page: number = 0, size: number = 10) => {
  const response = await api.get<NotificationsDataResponse>(`/notifications?page=${page}&size=${size}`)
  return response.data.data
}

// 모든 알림 읽음 처리
export const patchNotifications = async () => {
  await api.patch<NotificationsPatchResponse>(`/notifications/read-all`)
}

// 알림 읽음 처리
export const readNotification = async (notificationId: number) => {
  await api.patch<NotificationsPatchResponse>(`/notifications/${notificationId}/read`)
}

// 안 읽은 알림 조회
export const getUnreadCount = async () => {
  const response = await api.get<NotificationsUnReadCountResponse>(`/notifications/unread-count`)
  return response.data.data
}
