import type { NotificationsDataResponse, NotificationsPatchResponse, NotificationsUnReadCountResponse } from '@/types/notifications'
import { api } from './api'

export const fetchNotifications = async (page: number = 0, size: number = 10) => {
  const response = await api.get<NotificationsDataResponse>(`/notifications?page=${page}&size=${size}`)
  return response.data.data
}

export const patchNotifications = async () => {
  await api.patch<NotificationsPatchResponse>(`/notifications/read-all`)
}

export const readNotification = async (notificationId: number) => {
  await api.patch<NotificationsPatchResponse>(`/notifications/${notificationId}/read`)
}

export const getUnreadCount = async () => {
  const response = await api.get<NotificationsUnReadCountResponse>(`/notifications/unread-count`)
  return response.data.data
}
