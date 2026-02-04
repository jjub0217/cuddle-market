'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { fetchNotifications, patchNotifications, readNotification } from '@/lib/api/notifications'
import { useUserStore } from '@/store/userStore'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'
import NotificationItem from './NotificationItem'
import { getNavigationPath } from '@/lib/utils/getNavigationPath'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import NotificationsSkeleton from './NotificationsSkeleton'
import { chatSocketStore } from '@/store/chatSocketStore'

interface NotificationsDropdownProps {
  isNotificationOpen: boolean
  setIsNotificationOpen: (isNotificationOpen: boolean) => void
}

export default function NotificationsDropdown({ isNotificationOpen, setIsNotificationOpen }: NotificationsDropdownProps) {
  const queryClient = useQueryClient()

  const user = useUserStore((state) => state.user)
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isNotificationOpen, [modalRef], () => setIsNotificationOpen(false))
  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
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
    await patchNotifications()
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
    // 채팅 알림인 경우 ChatRooms의 unreadCount도 감소
    if (notification.relatedEntityType === 'CHAT_ROOM') {
      chatSocketStore.getState().clearUnreadCount(notification.relatedEntityId)
    }
    const currentPath = window.location.pathname
    const targetPath = getNavigationPath(notification)
    setIsNotificationOpen(false)

    if (currentPath === targetPath) {
      // 같은 페이지 로직
      if (notification.relatedEntityType === 'POST') {
        // 게시글 + 댓글 모두 refetch
        queryClient.invalidateQueries({
          queryKey: ['community', String(notification.relatedEntityId)],
        })
      }
    } else {
      // 다른 페이지 로직 (기존 navigate)
      router.push(targetPath)
    }
    await readNotification(notification.notificationId)
    refetch()
  }

  return (
    <div
      ref={modalRef}
      className={cn(
        'absolute top-12 right-0 max-h-[819.2px] min-w-91 overflow-hidden rounded-lg border border-gray-200 bg-white',
        `${Z_INDEX.DROPDOWN}`
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 pt-4 pb-4.25">
        <div className="flex items-center gap-1">
          <h3 className="flex items-center justify-start text-lg font-semibold text-gray-900">알림</h3>
        </div>
        <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="text-primary-600 flex cursor-pointer items-center justify-center text-center text-sm"
        >
          모두 읽음
        </button>
      </div>

      <div className="scrollbar-hide flex max-h-80 flex-col overflow-y-auto" role="tabpanel">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : notificationsData?.pages.some((page) => page.content.length > 0) ? (
          <>
            {notificationsData?.pages.flatMap((page) =>
              page.content.map((notification: NotificationItemType) => (
                <NotificationItem
                  key={notification.notificationId}
                  {...notification}
                  setIsNotificationOpen={setIsNotificationOpen}
                  handleReadNotification={handleReadNotification}
                />
              ))
            )}
            <div ref={observerTargetRef} className="h-1" />
          </>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">표시할 알림이 없습니다.</div>
        )}
      </div>
      <div className="flex h-11.25 border-t border-gray-200" />
    </div>
  )
}
