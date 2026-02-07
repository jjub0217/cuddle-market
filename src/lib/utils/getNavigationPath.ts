import { ROUTES } from '@/constants/routes'
import type { NotificationItem } from '@/types/notifications'

export const getNavigationPath = (notification: NotificationItem): string => {
  const { relatedEntityType, relatedEntityId, notificationType } = notification

  switch (relatedEntityType) {
    case 'CHAT_ROOM':
      return ROUTES.CHAT_ROOM_ID(relatedEntityId)
    case 'PRODUCT':
      return ROUTES.DETAIL_ID(relatedEntityId)
    case 'POST':
      return ROUTES.COMMUNITY_DETAIL_ID(relatedEntityId)
    default:
      if (notificationType === 'ADMIN_SANCTION') {
        return ROUTES.MYPAGE
      }
      if (notificationType === 'POST_DELETED') {
        return ROUTES.COMMUNITY
      }
      return ROUTES.HOME
  }
}
