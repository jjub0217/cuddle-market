'use client'

import UserMenu from '../components/user-section/UserMenu'
import AuthMenu from '../components/user-section/AuthMenu'
import { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { MessageCircleMore, Bell } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'
import NotificationsDropdown from './notification-section/NotificationsDropdown'
import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '@/lib/api/notifications'
import { useNotificationSSE } from '@/hooks/useNotifications'

interface UserControlsProps {
  isSideOpen: boolean
  setIsSideOpen: (isSideOpen: boolean) => void
  hideMenuButton?: boolean
}

export default function UserControls({ isSideOpen, setIsSideOpen, hideMenuButton = false }: UserControlsProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const user = useUserStore((state) => state.user)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { isLogin } = useUserStore()
  useNotificationSSE()
  const handleBellToggle = () => {
    setIsNotificationOpen(!isNotificationOpen)
  }
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => getUnreadCount(),
    enabled: !!user,
  })

  return (
    <div className="flex items-center gap-2 xl:gap-4">
      {isLogin() ? (
        <div className="flex items-center gap-1">
          <Link href={ROUTES.CHAT} className="ml-1" aria-label="채팅">
            <MessageCircleMore className="text-white" strokeWidth={1.5} />
          </Link>
          <div className="relative mr-2.5" onClick={handleBellToggle}>
            <IconButton aria-label="알림" size="lg" className="hover:bg-transparent">
              <Bell size={24} className="stroke-white" />
            </IconButton>
            {(unreadCountData?.unreadCount ?? 0) > 0 && (
              <span className="bg-danger-500 absolute top-0 -right-2 flex size-5 items-center justify-center rounded-full p-2 text-sm text-white">
                {unreadCountData?.unreadCount}
              </span>
            )}
            {isNotificationOpen && <NotificationsDropdown isNotificationOpen={isNotificationOpen} setIsNotificationOpen={setIsNotificationOpen} />}
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
