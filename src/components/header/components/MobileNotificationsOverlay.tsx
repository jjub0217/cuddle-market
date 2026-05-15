'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useUserStore } from '@/store/userStore'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'
import NotificationItem from './notification-section/NotificationItem'
import { useRouter, usePathname } from 'next/navigation'
import { getNavigationPath } from '@/lib/utils/getNavigationPath'
import NotificationsSkeleton from './notification-section/NotificationsSkeleton'
import { chatSocketStore } from '@/store/chatSocketStore'

interface MobileNotificationsOverlayProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 모바일 전용 풀스크린 알림 오버레이.
 *
 * - 좌측에서 우측으로 슬라이드 인 (`-translate-x-full` → `translate-x-0`)
 * - 닫기 버튼/ESC로 닫힘
 * - 열렸을 때 body 스크롤 잠금
 * - 데스크탑(`xl`)에서는 항상 숨김 (그쪽은 `NotificationsDropdown` 사용)
 */
export default function MobileNotificationsOverlay({ isOpen, onClose }: MobileNotificationsOverlayProps) {
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
      const data = await fetchGraphQL<{ notifications: any }>(
        `
        query Notifications($page: Int!, $size: Int!) {
          notifications(page: $page, size: $size) {
            content { notificationId notificationType title content relatedEntityType relatedEntityId isRead readAt createdAt }
            page hasNext
          }
        }
      `,
        { page: pageParam, size: 10 }
      )
      return data.notifications
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!user && isOpen,
  })

  const observerTargetRef = useIntersectionObserver({
    enabled: hasNextPage ?? false,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    onIntersect: () => fetchNextPage(),
    threshold: 0.5,
  })

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // 열림 동안 body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const handleMarkAllAsRead = async () => {
    await fetchGraphQL(`
      mutation MarkAllNotificationsRead {
        markAllNotificationsRead { success }
      }
    `)
    queryClient.setQueryData<{ unreadCount: number }>(['notifications', 'unreadCount'], { unreadCount: 0 })
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
    onClose()

    if (currentPath === targetPath) {
      if (notification.relatedEntityType === 'POST') {
        queryClient.invalidateQueries({ queryKey: ['community', String(notification.relatedEntityId)] })
      }
    } else {
      router.push(targetPath)
    }
    await fetchGraphQL(
      `
      mutation MarkNotificationRead($notificationId: Int!) {
        markNotificationRead(notificationId: $notificationId) { success }
      }
    `,
      { notificationId: notification.notificationId }
    )
    refetch()
  }

  return (
    <div
      className={cn(
        'fixed inset-0 bg-white transition-transform duration-300 ease-out xl:hidden',
        Z_INDEX.MODAL,
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="알림"
      aria-hidden={!isOpen}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-2 pr-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="알림 닫기"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">알림</h2>
        </div>
        <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="text-primary-600 cursor-pointer text-sm"
        >
          모두 읽음
        </button>
      </div>

      <div className="flex h-[calc(100%-4rem)] flex-col overflow-y-auto" role="tabpanel">
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
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">표시할 알림이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
