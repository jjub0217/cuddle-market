'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'
import { Z_INDEX } from '@/constants/ui'
import Logo from '@/components/Logo'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { IconButton } from '@/components/commons/button/IconButton'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { chatSocketStore } from '@/store/chatSocketStore'
import { logout } from '@/lib/api/auth'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const [isCommunityOpen, setIsCommunityOpen] = useState(false)
  const [communityHeight, setCommunityHeight] = useState(0)
  const communityRef = useRef<HTMLDivElement>(null)

  const [isCustomerOpen, setIsCustomerOpen] = useState(false)
  const [customerHeight, setCustomerHeight] = useState(0)
  const customerRef = useRef<HTMLDivElement>(null)

  const sideNavRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isOpen, [sideNavRef], onClose)

  const { isLogin, clearAll, user } = useUserStore()
  const { openLogoutModal } = useLoginModalStore()
  const { disconnect } = chatSocketStore()

  // SSR-safe: 초기에는 비로그인 상태로 렌더링, 마운트 후 실제 상태로 업데이트
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    setIsLoggedIn(isLogin())
  }, [isLogin, user])

  // 로그인 필수 페이지 목록
  const authRequiredPaths = [ROUTES.MYPAGE, ROUTES.PROFILE_UPDATE, ROUTES.CHAT]

  // 현재 페이지가 로그인 필수 페이지인지 확인
  const isAuthRequiredPage = authRequiredPaths.some((path) => pathname.startsWith(path))

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('로그아웃 API 실패:', error)
    } finally {
      onClose()
      disconnect()
      clearAll()
      queryClient.clear()
      if (isAuthRequiredPage) {
        router.push(ROUTES.HOME)
      }
    }
  }

  const handleLogoutClick = () => {
    openLogoutModal(handleLogout)
  }

  useEffect(() => {
    if (communityRef.current) {
      setCommunityHeight(communityRef.current.scrollHeight)
    }
    if (customerRef.current) {
      setCustomerHeight(customerRef.current.scrollHeight)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }

    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  return (
    <>
      <div
        className={cn('fixed inset-0 bg-black/50 transition-opacity', Z_INDEX.OVERLAY, isOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
      />
      <nav
        className={cn(
          'fixed top-0 left-0 h-full w-9/12 -translate-x-full overflow-y-auto bg-white px-4 py-5 transition-transform data-[open=true]:translate-x-0',
          Z_INDEX.SIDEBAR
        )}
        data-open={isOpen}
        ref={sideNavRef}
      >
        <div className="flex flex-col gap-5 border-b border-gray-200 pb-5">
          <div className="flex items-center justify-between">
            <Logo textClassname="text-gray-600" onClick={onClose} />
            <IconButton onClick={onClose} aria-label="메뉴 닫기">
              <X className="text-gray-500" />
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogoutClick}
                className="border-primary-200 text-primary-200 flex-1 cursor-pointer rounded-sm border py-2 text-center text-sm font-bold"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href={ROUTES.LOGIN}
                onClick={onClose}
                className="border-primary-200 text-primary-200 flex-1 rounded-sm border py-2 text-center text-sm font-bold"
              >
                로그인
              </Link>
            )}
            <Link
              href={isLoggedIn ? ROUTES.MYPAGE : ROUTES.SIGNUP}
              onClick={onClose}
              className="border-primary-200 bg-primary-200 flex-1 rounded-sm border py-2 text-center text-sm font-bold text-white"
            >
              {isLoggedIn ? '마이페이지' : '회원가입'}
            </Link>
          </div>
        </div>
        <div className="pt-5">
          <Link href={ROUTES.HOME} onClick={onClose} className="flex w-full items-center justify-between py-2">
            <span className="font-bold">마켓</span>
          </Link>
          <div>
            <button
              type="button"
              onClick={() => setIsCommunityOpen(!isCommunityOpen)}
              className="flex w-full cursor-pointer items-center justify-between py-2"
            >
              <span className="font-bold">커뮤니티</span>
              <ChevronDown className={cn('h-5 w-5 transition-transform', isCommunityOpen && 'rotate-180')} />
            </button>
            <div
              ref={communityRef}
              className="overflow-hidden transition-[height] duration-300"
              style={{ height: isCommunityOpen ? `${communityHeight}px` : '0' }}
            >
              <div className="flex flex-col gap-2 pt-2 pl-4">
                <Link href={`${ROUTES.COMMUNITY}?tab=tab-question`} onClick={onClose}>
                  질문 있어요
                </Link>
                <Link href={`${ROUTES.COMMUNITY}?tab=tab-info`} onClick={onClose}>
                  정보 공유
                </Link>
              </div>
            </div>
          </div>
          <div>
            <button type="button" onClick={() => setIsCustomerOpen(!isCustomerOpen)} className="flex w-full items-center justify-between py-2">
              <span className="font-bold">고객센터</span>
              <ChevronDown className={cn('h-5 w-5 transition-transform', isCustomerOpen && 'rotate-180')} />
            </button>
            <div
              ref={customerRef}
              className="overflow-hidden transition-[height] duration-300"
              style={{ height: isCustomerOpen ? `${customerHeight}px` : '0' }}
            >
              <div className="flex flex-col gap-2 pt-2 pl-4">
                <a href="mailto:support@cuddlemarket.com?subject=허들마켓 1:1 문의">1:1 문의</a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
