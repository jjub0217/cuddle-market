'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'
import { Z_INDEX } from '@/constants/ui'
import Logo from '@/components/Logo'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import IconButton from '@/components/commons/button/IconButton'
import { useUserStore } from '@/store/userStore'
import { useLogout } from '@/hooks/useLogout'


interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const [isCustomerOpen, setIsCustomerOpen] = useState(false)
  const [customerHeight, setCustomerHeight] = useState(0)
  const customerRef = useRef<HTMLDivElement>(null)

  const sideNavRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isOpen, [sideNavRef], onClose)

  const { isLogin } = useUserStore()
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const { openLogoutConfirm } = useLogout(onClose)

  useEffect(() => {
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
          'fixed top-0 right-0 h-full w-full translate-x-full overflow-y-auto bg-white px-4 py-5 transition-transform duration-300 data-[open=true]:translate-x-0',
          Z_INDEX.SIDEBAR,
        )}
        data-open={isOpen}
        ref={sideNavRef}
      >
        <div className="flex flex-col gap-5 border-b border-gray-200 pb-5">
          <div className="flex items-center justify-between">
            <Logo onClick={onClose} />
            <IconButton onClick={onClose} aria-label="메뉴 닫기">
              <X className="text-gray-500" />
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            {hasHydrated && isLogin() ? (
              <button
                type="button"
                onClick={openLogoutConfirm}
                className="border-primary-200 text-primary-200 flex-1 cursor-pointer rounded-sm border py-2 text-center text-sm font-semibold"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href={ROUTES.LOGIN}
                onClick={onClose}
                className="border-primary-200 text-primary-200 flex-1 rounded-sm border py-2 text-center text-sm font-semibold"
              >
                로그인
              </Link>
            )}
            <Link
              href={hasHydrated && isLogin() ? ROUTES.MYPAGE : ROUTES.SIGNUP}
              onClick={onClose}
              className="border-primary-200 bg-primary-200 flex-1 rounded-sm border py-2 text-center text-sm font-normal text-white"
            >
              {hasHydrated && isLogin() ? '마이페이지' : '회원가입'}
            </Link>
          </div>
        </div>
        <div className="pt-5">
          <div>
            <button type="button" onClick={() => setIsCustomerOpen((prev) => !prev)} className="flex w-full items-center justify-between py-2">
              <span className="font-normal">고객센터</span>
              <ChevronDown className={cn('h-5 w-5 transition-transform', isCustomerOpen && 'rotate-180')} />
            </button>
            <div
              ref={customerRef}
              className="overflow-hidden transition-[height] duration-300"
              style={{ height: isCustomerOpen ? `${customerHeight}px` : '0' }}
            >
              <div className="flex flex-col gap-2 pl-4">
                <a href="mailto:devel.jjub@gmail.com?subject=커들마켓 1:1 문의">1:1 문의</a>
              </div>
            </div>
          </div>

          {/* 안내 문서는 '내 것'이 아니라 서비스 안내라서 마이페이지가 아니라 여기 둔다.
              구글 플레이 이용자는 전부 모바일이라, 모바일에서 숨겨지는 푸터만으로는 닿을 수 없다.
              계정 삭제 안내는 앱을 지운 뒤 웹으로 찾아오는 사람을 위한 것이기도 하다.
              (항목이 늘어날 때의 구조는 Footer.tsx 주석 참고) */}
          <Link href={ROUTES.PRIVACY} onClick={onClose} className="block py-2 font-normal">
            개인정보처리방침
          </Link>
          <Link href={ROUTES.ACCOUNT_DELETION} onClick={onClose} className="block py-2 font-normal">
            계정 삭제 안내
          </Link>
        </div>
      </nav>
    </>
  )
}
