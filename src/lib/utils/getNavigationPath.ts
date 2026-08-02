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
    // 배포(2026-08-02) 전에 생긴 답글 알림은 'COMMENT' + **댓글** 번호로 남아 있다.
    // 그것만으로는 어느 글인지 알 수 없어 상세로 못 간다. 홈보다는 커뮤니티가 가깝다.
    // 새로 생기는 답글 알림은 서버가 'POST' + 글 번호를 준다.
    case 'COMMENT':
      return ROUTES.COMMUNITY
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
