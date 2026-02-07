import { ROUTES } from '@/constants/routes'
import { NotificationType, type NotificationItem } from '@/types/notifications'

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
      if (notificationType === NotificationType.ADMIN_SANCTION) {
        return ROUTES.MYPAGE
      }
      if (notificationType === NotificationType.POST_DELETED) {
        return ROUTES.COMMUNITY
      }
      return ROUTES.HOME
  }
}
