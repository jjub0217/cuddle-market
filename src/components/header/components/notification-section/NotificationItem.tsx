import { cn } from '@/lib/utils/cn'
import { Bell as BellIcon } from 'lucide-react'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'
import { iconMap, NOTIFICATION_MESSAGES, type NotificationType } from '@/constants/constants'
import { getTimeAgo } from '@cuddle/shared'
import { notificationIconClass, notificationIconStrokeClass } from './notificationIconClass'

interface NotificationItemProps extends NotificationItemType {
  handleReadNotification: (notification: NotificationItemType) => void
}

/** 알림 줄 오른쪽에 그릴 표시. */
type UnreadMark = { kind: 'none' } | { kind: 'dot' } | { kind: 'count'; text: string }

/**
 * 알림 줄 오른쪽에 무엇을 그릴지 고른다.
 *
 * 앱의 `mobile/lib/notifications.ts` 의 `resolveUnreadMark` 와 **같은 규칙**이다.
 * 같은 알림이 웹과 앱에서 다르게 보이면 안 된다 — 규칙을 고칠 때는 양쪽을 같이 고친다.
 *
 *   읽음                      아무것도 안 그린다
 *   안 읽음 · groupCount ≥ 2   숫자 뱃지 (99 넘으면 99+)
 *   그 밖에 안 읽음             지금까지처럼 점
 *
 * `groupCount` 가 1이거나 없을 때 점을 쓰는 것은 「1」이 오히려 시끄럽기 때문이다.
 * 값이 아예 안 올 수도 있다 — 조회 쿼리에 필드를 안 적었거나 서버 배포가 늦은 경우다.
 */
function resolveUnreadMark(notification: NotificationItemType): UnreadMark {
  if (notification.isRead) return { kind: 'none' }

  const count = notification.groupCount ?? 0
  if (count < 2) return { kind: 'dot' }

  return { kind: 'count', text: count > 99 ? '99+' : String(count) }
}

export default function NotificationItem({ handleReadNotification, ...notification }: NotificationItemProps) {
  const Icon = iconMap[notification.notificationType as NotificationType] || BellIcon
  const mark = resolveUnreadMark(notification)

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
          className={cn('h-4.5 w-4.5', notificationIconStrokeClass({ type: notification.notificationType as NotificationType }))}
          strokeWidth={2}
        />
      </div>
      <div className="flex min-w-64 flex-1 justify-between gap-1">
        <div className="flex flex-col gap-1">
          <p className="line-clamp-2 text-left text-sm font-semibold text-gray-900">
            {NOTIFICATION_MESSAGES[notification.notificationType] ?? '알림이 도착했습니다'}
          </p>
          <p className="line-clamp-2 text-left text-sm text-gray-900">{notification.content}</p>
          <p className="flex items-center text-xs text-gray-500">{getTimeAgo(notification.createdAt)}</p>
        </div>
        {mark.kind === 'dot' ? (
          <div className="flex pt-2">
            <div className="bg-primary-500 size-2 rounded-full" />
          </div>
        ) : null}
        {/*
          묶인 채팅이 여럿일 때 점 대신 그린다.

          ⚠️ **점 색(primary-500)을 그대로 쓰지 말 것.** 두 갈색이 달라 보여 맞추고 싶어지는데,
             그러면 **안의 글자가 안 읽힌다.**
               primary-500 #B06F15  흰 글자 대비 4.09:1  ← 11~12px 글자에는 모자라다
               primary-600 #825500  흰 글자 대비 6.46:1  ← 통과
             점은 속이 빈 도형이라 대비를 안 따져도 되지만, 뱃지는 안에 글자가 들어간다.
             앱도 같은 값(#825500 = colors.action)을 쓴다 — mobile/components/notifications/notification-row.tsx.
        */}
        {mark.kind === 'count' ? (
          <div className="flex pt-1.5">
            <span className="bg-primary-600 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white">
              {mark.text}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
