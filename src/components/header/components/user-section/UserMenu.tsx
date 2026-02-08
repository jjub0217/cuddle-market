'use client'

import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'
import { UserRound as UserRoundIcon, LogOut as LogOutIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useUserStore } from '@/store/userStore'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import Link from 'next/link'
import { useRef } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import IconButton from '@/components/commons/button/IconButton'
import { Menu } from 'lucide-react'
import { useLogout } from '@/hooks/useLogout'

interface UserMenuProps {
  isNotificationOpen: boolean
  setIsNotificationOpen: (isNotificationOpen: boolean) => void
  isUserMenuOpen: boolean
  setIsUserMenuOpen: (isUserMenuOpen: boolean) => void
  isSideOpen: boolean
  setIsSideOpen: (isSideOpen: boolean) => void
  userNickname?: string
}

export default function UserMenu({
  isNotificationOpen,
  setIsNotificationOpen,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isSideOpen,
  setIsSideOpen,
}: UserMenuProps) {
  const { user } = useUserStore()
  const modalRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isUserMenuOpen, [modalRef], () => setIsUserMenuOpen(false))
  const isMd = useMediaQuery('(min-width: 768px)')
  const { openLogoutConfirm } = useLogout(() => setIsUserMenuOpen(false))

  const handleAvatarToggle = () => {
    if (isNotificationOpen) {
      setIsNotificationOpen(false)
    }
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  // 로그아웃 버튼 클릭 시 확인 모달 열기
  const handleLogoutClick = () => {
    setIsUserMenuOpen(false)
    openLogoutConfirm()
  }

  return isMd ? (
    <div className="relative flex cursor-pointer items-center gap-2" onClick={handleAvatarToggle}>
      <ProfileAvatar imageUrl={user?.profileImageUrl} nickname={user?.nickname || ''} size="sm" />
      {isUserMenuOpen && (
        <div
          className={cn(
            'absolute top-12 right-0 flex w-32 flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-lg md:w-48',
            Z_INDEX.BUTTON,
          )}
          ref={modalRef}
        >
          <Link href={ROUTES.MYPAGE} className="hover:bg-primary-50 flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700">
            <UserRoundIcon className="h-5 w-5" />
            마이페이지
          </Link>
          <button
            onClick={handleLogoutClick}
            className="hover:bg-primary-50 text-danger-500 flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm"
          >
            <LogOutIcon className="h-5 w-5 rotate-180" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  ) : (
    <IconButton aria-label="메뉴" onClick={() => setIsSideOpen(!isSideOpen)}>
      <Menu className="text-white" />
    </IconButton>
  )
}
