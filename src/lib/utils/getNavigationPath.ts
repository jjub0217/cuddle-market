import { ROUTES } from '@/constants/routes'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'

export const getNavigationPath = (notification: NotificationItemType): string => {
  const { relatedEntityType, relatedEntityId, notificationType } = notification

  switch (relatedEntityType) {
    case 'CHAT_ROOM':
      return ROUTES.CHAT_ROOM_ID(relatedEntityId)
    case 'PRODUCT':
      return ROUTES.DETAIL_ID(relatedEntityId)
    case 'POST':
      return ROUTES.COMMUNITY_DETAIL_ID(relatedEntityId)
    default:
      // relatedEntityType이 없거나 알 수 없는 경우 notificationType으로 폴백
      if (notificationType === 'ADMIN_SANCTION') {
        return ROUTES.MYPAGE
      }
      if (notificationType === 'POST_DELETED') {
        return ROUTES.COMMUNITY
      }
      return ROUTES.HOME
  }
}
