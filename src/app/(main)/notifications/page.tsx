'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useUserStore } from '@/store/userStore'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'
import NotificationItem from '@/components/header/components/notification-section/NotificationItem'
import { useRouter, usePathname } from 'next/navigation'
import { getNavigationPath } from '@/lib/utils/getNavigationPath'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { chatSocketStore } from '@/store/chatSocketStore'
import NotificationsSkeleton from '@/components/header/components/notification-section/NotificationsSkeleton'
import NotificationsEmpty from '@/components/header/components/notification-section/NotificationsEmpty'
import { ArrowLeft } from 'lucide-react'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const router = useRouter()
  const pathname = usePathname()

  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const data = await fetchGraphQL<{ notifications: any }>(`
        query Notifications($page: Int!, $size: Int!) {
          notifications(page: $page, size: $size) {
            content { notificationId notificationType title content relatedEntityType relatedEntityId isRead readAt createdAt groupCount }
            page hasNext
          }
        }
      `, { page: pageParam, size: 10 })
      return data.notifications
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!user,
  })

  const observerTargetRef = useIntersectionObserver({
    enabled: hasNextPage ?? false,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    onIntersect: () => fetchNextPage(),
    threshold: 0.5,
  })

  const handleMarkAllAsRead = async () => {
    await fetchGraphQL(`
      mutation MarkAllNotificationsRead {
        markAllNotificationsRead { success }
      }
    `)
    queryClient.setQueryData<{ unreadCount: number }>(['notifications', 'unreadCount'], {
      unreadCount: 0,
    })
    refetch()
  }

  const handleReadNotification = async (notification: NotificationItemType) => {
    if (!notification.isRead) {
      queryClient.setQueryData<{ unreadCount: number }>(['notifications', 'unreadCount'], (prev) => ({
        unreadCount: Math.max((prev?.unreadCount ?? 0) - 1, 0),
      }))
    }
    if (notification.relatedEntityType === 'CHAT_ROOM') {
      chatSocketStore.getState().clearUnreadCount(notification.relatedEntityId)
    }
    const currentPath = pathname
    const targetPath = getNavigationPath(notification)

    if (currentPath !== targetPath) {
      router.push(targetPath)
    }
    await fetchGraphQL(`
      mutation MarkNotificationRead($notificationId: Int!) {
        markNotificationRead(notificationId: $notificationId) { success }
      }
    `, { notificationId: notification.notificationId })
    refetch()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-bold">알림</span>
        </div>
        <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="text-primary-600 text-sm"
        >
          모두 읽음
        </button>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : notificationsData?.pages.some((page) => page.content.length > 0) ? (
          <>
            {notificationsData?.pages.flatMap((page) =>
              page.content.map((notification: NotificationItemType) => (
                <NotificationItem
                  key={notification.notificationId}
                  {...notification}
                  handleReadNotification={handleReadNotification}
                />
              ))
            )}
            <div ref={observerTargetRef} className="h-1" />
          </>
        ) : (
          <NotificationsEmpty className="h-64" />
        )}
      </div>
    </div>
  )
}
