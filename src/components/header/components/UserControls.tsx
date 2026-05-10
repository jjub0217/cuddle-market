'use client'

import UserMenu from '../components/user-section/UserMenu'
import AuthMenu from '../components/user-section/AuthMenu'
import React, { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { MessageCircleMore, Bell } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'
import NotificationsDropdown from './notification-section/NotificationsDropdown'
import { useQuery } from '@tanstack/react-query'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useNotificationSSE } from '@/hooks/useNotifications'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface UserControlsProps {
  isSideOpen: boolean
  setIsSideOpen: React.Dispatch<React.SetStateAction<boolean>>
  hideMenuButton?: boolean
}

export default function UserControls({ isSideOpen, setIsSideOpen, hideMenuButton = false }: UserControlsProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const user = useUserStore((state) => state.user)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { isLogin } = useUserStore()
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width: 767px)')
  useNotificationSSE()
  const handleBellToggle = () => {
    if (isMobile) {
      router.push(ROUTES.NOTIFICATIONS)
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
    <div className="flex items-center gap-2 xl:gap-4">
      {hasHydrated && isLogin() ? (
        <div className="flex items-center gap-1">
          <Link href={ROUTES.CHAT} className="ml-1 hidden xl:block" aria-label="채팅">
            <MessageCircleMore className="text-[#633f00]" strokeWidth={1.5} />
          </Link>
          <div className="relative mr-2.5" onClick={handleBellToggle}>
            <IconButton aria-label="알림" size="lg" className="hover:bg-transparent">
              <Bell size={24} className="stroke-[#633f00]" />
            </IconButton>
            {(unreadCountData?.unreadCount ?? 0) > 0 ? (
              <span className="bg-danger-500 absolute top-0 -right-2 flex size-5 items-center justify-center rounded-full p-2 text-sm text-white">
                {unreadCountData?.unreadCount}
              </span>
            ) : null}
            {isNotificationOpen ? <NotificationsDropdown isNotificationOpen={isNotificationOpen} setIsNotificationOpen={setIsNotificationOpen} /> : null}
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
