'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
import { markNotificationRead } from '@/lib/api/notifications'
import { useUserStore } from '@/store/userStore'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { NotificationItem as NotificationItemType } from '@/types/notifications'
import NotificationItem from './notification-section/NotificationItem'
import { useRouter, usePathname } from 'next/navigation'
import { getNavigationPath } from '@/lib/utils/getNavigationPath'
import NotificationsSkeleton from './notification-section/NotificationsSkeleton'
import NotificationsEmpty from './notification-section/NotificationsEmpty'
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
 * - 열려 있는 동안 초점을 이 상자 안에 가둔다(#981)
 * - 데스크탑(`xl`)에서는 항상 숨김 (그쪽은 `NotificationsDropdown` 사용)
 */
export default function MobileNotificationsOverlay({ isOpen, onClose }: MobileNotificationsOverlayProps) {
  // 초점 가둠(#981).
  //
  // 상자에 `tabIndex` 를 주지 않아 훅이 **안쪽 첫 요소**에 초점을 준다.
  // DOM 순서상 첫 요소는 닫기(X) 단추다 — 목록이 비어 있어도, 아직 불러오는 중이어도
  // 머리줄의 닫기·「모두 읽음」 두 단추는 항상 그려지므로
  // 「안에 초점 줄 것이 하나도 없는」 경우는 생기지 않는다.
  const overlayRef = useFocusTrap<HTMLDivElement>(isOpen)

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
            content { notificationId notificationType title content relatedEntityType relatedEntityId isRead readAt createdAt groupCount }
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
    await markNotificationRead(notification.notificationId)
    refetch()
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        // 「여기부터 데스크탑」은 lg(1024)다 — 헤더와 같은 값이어야 한다(#961).
        'fixed inset-0 bg-white transition-transform duration-300 ease-out lg:hidden',
        Z_INDEX.MODAL,
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="알림"
      aria-hidden={!isOpen}
      // 닫혀 있는 동안 탭 순서에서 통째로 뺀다(#999).
      // 바로 위 `aria-hidden` 은 화면낭독기에서만 감출 뿐 **초점은 못 막는다** — 둘 다 필요하다.
      // ⚠️ `visibility: hidden` 으로 막지 말 것 — 여닫는 애니메이션이 끊긴다.
      inert={!isOpen}
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

      {/*
        아래 pb-[...]는 지우지 말 것.
        이 오버레이는 하단 탭바(BottomNav)를 일부러 덮지 않는다 — 알림을 열어둔 채로도 다른 탭으로 갈 수 있게 한 의도.
        그래서 탭바에 가려지는 만큼(BottomNav의 h-14 = 3.5rem + 아이폰 홈 인디케이터 영역 env(safe-area-inset-bottom))
        목록 아래에 여백을 줘야 마지막 알림이 안 잘린다.
        BottomNav 높이를 바꾸면 여기 3.5rem도 같이 바꿔야 한다. (src/components/bottom-nav/BottomNav.tsx)
      */}
      <div
        className="flex h-[calc(100%-4rem)] flex-col overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))]"
        role="tabpanel"
      >
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
          <NotificationsEmpty className="min-h-32" />
        )}
      </div>
    </div>
  )
}
