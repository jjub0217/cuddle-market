'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, MapPin, MessageCircleMore, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'
import { Z_INDEX } from '@/constants/ui'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const NAV_ITEMS = [
  { href: ROUTES.HOME, label: '홈', icon: Home, match: (p: string) => p === '/' || p.startsWith('/market') },
  { href: ROUTES.COMMUNITY, label: '커뮤니티', icon: Users, match: (p: string) => p.startsWith('/community') },
  { href: ROUTES.MAP, label: '플레이스', icon: MapPin, match: (p: string) => p.startsWith('/map') },
  { href: ROUTES.CHAT, label: '채팅', icon: MessageCircleMore, match: (p: string) => p.startsWith('/chat') },
  { href: ROUTES.MYPAGE, label: '마이', icon: UserRound, match: (p: string) => p.startsWith('/mypage') },
] as const

// BottomNav 숨김 경로
const HIDE_BOTTOMNAV_PATHS: string[] = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FIND_PASSWORD,
  ROUTES.PRODUCT_POST,
  ROUTES.COMMUNITY_POST,
  ROUTES.PROFILE_UPDATE,
  ROUTES.NOTIFICATIONS,
]

const HIDE_BOTTOMNAV_PATTERNS = [
  /^\/chat\/\d+$/, // 채팅방
  /^\/community\/\d+$/, // 커뮤니티 상세
  /^\/community\/\d+\/edit$/, // 커뮤니티 수정
  /^\/products\/\d+\/edit$/, // 상품 수정
]

export default function BottomNav() {
  const pathname = usePathname()
  const isXl = useMediaQuery('(min-width: 1280px)')

  if (isXl) return null

  const shouldHide =
    HIDE_BOTTOMNAV_PATHS.includes(pathname) ||
    HIDE_BOTTOMNAV_PATTERNS.some((pattern) => pattern.test(pathname))

  if (shouldHide) return null

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]',
        Z_INDEX.HEADER
      )}
      aria-label="하단 메뉴"
    >
      <div className="flex h-14 items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5',
                isActive ? 'text-primary-200' : 'text-gray-400'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
