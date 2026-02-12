import { cn } from '@/lib/utils/cn'
import { Bell as BellIcon } from 'lucide-react'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'
import { iconMap, NOTIFICATION_MESSAGES, type NotificationType } from '@/constants/constants'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { notificationIconClass, notificationIconStrokeClass } from './notificationIconClass'

interface NotificationItemProps extends NotificationItemType {
  handleReadNotification: (notification: NotificationItemType) => void
}

export default function NotificationItem({ handleReadNotification, ...notification }: NotificationItemProps) {
  const Icon = iconMap[notification.notificationType as NotificationType] || BellIcon

  return (
    <div
      className={cn(
        'flex cursor-pointer items-start gap-3 border-b border-gray-200 px-4 pt-4.25 pb-4 transition-colors hover:bg-gray-50',
        !notification.isRead ? 'bg-primary-50' : 'bg-white'
      )}
      onClick={() => handleReadNotification(notification)}
    >
      <div className={cn(notificationIconClass({ type: notification.notificationType as NotificationType }))}>
        <Icon
          className={cn('h-5 w-5', notificationIconStrokeClass({ type: notification.notificationType as NotificationType }))}
        />
      </div>
      <div className="flex min-w-72 justify-between gap-1">
        <div className="flex flex-col gap-1">
          <p className="line-clamp-2 text-left text-sm font-semibold text-gray-900">
            {NOTIFICATION_MESSAGES[notification.notificationType] ?? '알림이 도착했습니다'}
          </p>
          <p className="line-clamp-2 text-left text-sm text-gray-900">{notification.content}</p>
          <p className="flex items-center text-xs text-gray-500">{getTimeAgo(notification.createdAt)}</p>
        </div>
        {!notification.isRead && (
          <div className="flex pt-2">
            <div className="bg-primary-500 size-2 rounded-full" />
          </div>
        )}
      </div>
    </div>
  )
}
