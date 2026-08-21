'use client'

import UserMenu from '../components/user-section/UserMenu'
import AuthMenu from '../components/user-section/AuthMenu'
import React, { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { MessageCircle, Bell } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'
import { HEADER_ICON_BUTTON_SIZE } from '@/components/header/headerIconButtonSize'
import NotificationsDropdown from './notification-section/NotificationsDropdown'
import { useQuery } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useNotificationSSE } from '@/hooks/useNotifications'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface UserControlsProps {
  isSideOpen: boolean
  setIsSideOpen: React.Dispatch<React.SetStateAction<boolean>>
  hideMenuButton?: boolean
  /**
   * 모바일 알림 오버레이를 연다.
   *
   * 오버레이를 여기서 그리지 않고 Header가 그리는 이유:
   * 헤더는 솔리드 상태일 때 backdrop-blur-sm을 쓴다. backdrop-filter가 걸린 요소는
   * 그 안의 position:fixed 자식에게 「기준 상자」가 되어(transform·filter와 같은 규칙),
   * fixed inset-0이 화면 전체가 아니라 헤더 높이로 잡힌다.
   * 게다가 헤더의 z-30이 쌓임 맥락을 만들어 오버레이의 z-[100]이 바깥에서
   * z-30으로 취급된다 — 같은 z-30인 FAB이 DOM에서 뒤라 위에 그려진다.
   * 두 증상 모두 헤더 밖으로 빼면 사라진다(#804).
   */
  onOpenMobileNotifications: () => void
}

export default function UserControls({
  isSideOpen,
  setIsSideOpen,
  hideMenuButton = false,
  onOpenMobileNotifications,
}: UserControlsProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const user = useUserStore((state) => state.user)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { isLogin } = useUserStore()
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const isMobile = useMediaQuery('(max-width: 767px)')
  // 종의 **생김새**는 767 이 아니라 lg(1024) 로 갈린다(#1000).
  //
  // 옆에 누가 서 있느냐가 기준이다.
  //   1024 미만  검색(돋보기)이 `lg:hidden` 으로 보인다 — 그쪽이 24 · 굵기 2 다
  //   1024 이상  검색은 사라지고 채팅(말풍선)이 나온다 — 그쪽이 20 · 굵기 1.5 다
  //
  // 전에는 이 줄의 `isMobile`(767) 을 그대로 썼다. 그래서 768~1023 에서만
  // 돋보기는 24 인데 종은 20 이라 종이 혼자 작아 보였다.
  //
  // ⚠️ 여는 방식은 여전히 767 로 갈린다(`isMobile`) — 모바일에서만 전체화면
  //    오버레이를 열고 태블릿·데스크탑은 드롭다운이다. 두 값을 합치지 마라.
  const isBelowLg = useMediaQuery('(max-width: 1023px)')
  useNotificationSSE()
  const handleBellToggle = () => {
    if (isMobile) {
      onOpenMobileNotifications()
    } else {
      setIsNotificationOpen((prev) => !prev)
    }
  }
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const data = await fetchGraphQL<{ unreadNotificationCount: { unreadCount: number } }>(`
        query UnreadNotificationCount {
          unreadNotificationCount { unreadCount }
        }
      `)
      return data.unreadNotificationCount
    },
    enabled: !!user,
  })

  return (
    <div className="flex items-center gap-2 lg:gap-4">
      {hasHydrated && isLogin() ? (
        <div className="flex items-center gap-1">
          <Link href={ROUTES.CHAT} className="ml-1 hidden lg:block" aria-label="채팅">
            <MessageCircle className="text-header-icon" strokeWidth={1.5} size={20} />
          </Link>
          <div className="relative" onClick={handleBellToggle}>
            <IconButton aria-label="알림" size={HEADER_ICON_BUTTON_SIZE} className="hover:bg-transparent">
              {/* 점의 기준을 버튼(40x40)이 아니라 종 자체로 삼는다.
                  버튼 기준이면 종 크기가 좁은 폭 24 / 넓은 폭 20으로 갈릴 때 점만
                  엉뚱한 자리에 남는다. 종을 감싸면 두 폭에서 같은 자리가 된다.
                  값(top 1 · right 3 · 8px)은 앱 app-header.tsx와 같다. */}
              {/* ⚠️ inline-flex 가 아니라 flex 다. inline 이면 줄 상자(line box)에 앉아
                  **아래에 글꼴 여백이 붙고**, 그만큼 종이 위로 밀린다 — 옆 채팅 아이콘과
                  중심이 3.5px 어긋나 있었다(#869 실측). 상자 높이도 48이 아니라 43이 됐다. */}
              <span className="relative flex">
                <Bell size={isBelowLg ? 24 : 20} strokeWidth={isBelowLg ? 2 : 1.5} className="text-header-icon" />
                {(unreadCountData?.unreadCount ?? 0) > 0 ? (
                  <span
                    className="bg-danger-500 absolute top-px right-[3px] size-2 rounded-full"
                    aria-label={`읽지 않은 알림 ${unreadCountData?.unreadCount}개`}
                  />
                ) : null}
              </span>
            </IconButton>
            {isNotificationOpen ? (
              <NotificationsDropdown isNotificationOpen={isNotificationOpen} setIsNotificationOpen={setIsNotificationOpen} />
            ) : null}
          </div>
          <UserMenu
            isNotificationOpen={false}
            setIsNotificationOpen={setIsNotificationOpen}
            isUserMenuOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            isSideOpen={isSideOpen}
            setIsSideOpen={setIsSideOpen}
          />
        </div>
      ) : (
        <AuthMenu setIsSideOpen={setIsSideOpen} isSideOpen={isSideOpen} hideMenuButton={hideMenuButton} />
      )}
    </div>
  )
}
