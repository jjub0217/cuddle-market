'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UsersRound, MapPin, MessageCircleMore, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'
import { isBottomNavHidden } from './isBottomNavHidden'
import { Z_INDEX } from '@/constants/ui'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const NAV_ITEMS = [
  { href: ROUTES.HOME, label: '홈', icon: Home, match: (p: string) => p === '/' || p.startsWith('/market') },
  { href: ROUTES.COMMUNITY, label: '커뮤니티', icon: UsersRound, match: (p: string) => p.startsWith('/community') },
  { href: ROUTES.MAP, label: '플레이스', icon: MapPin, match: (p: string) => p.startsWith('/map') },
  { href: ROUTES.CHAT, label: '채팅', icon: MessageCircleMore, match: (p: string) => p.startsWith('/chat') },
  { href: ROUTES.MYPAGE, label: '마이', icon: UserRound, match: (p: string) => p.startsWith('/mypage') },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const isXl = useMediaQuery('(min-width: 1280px)')

  if (isXl) return null

  // 규칙은 isBottomNavHidden 한 곳에 있다 — (main)/layout도 같은 답을 써서
  // 탭바 높이만큼 아래를 비켜 줄지 정한다.
  const shouldHide = isBottomNavHidden(pathname)

  if (shouldHide) return null

  return (
    <nav
      className={cn(
        'fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]',
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
                'flex flex-1 flex-col items-center justify-center gap-1',
                // 활성은 primary-container(#825500)다. 예전 primary-200(#ecc88e)은
                // 흰 배경 대비가 1.59:1이라 비활성 회색(2.54:1)보다 **더 흐렸다** —
                // 고른 탭이 가장 안 보이는 상태였다. 그 값은 「내 댓글」 알약처럼
                // 배경으로 쓰라고 만든 색이다(위에 흰 글자가 올라간다).
                isActive ? 'text-primary-container' : 'text-gray-400'
              )}
            >
              {/* 크기·굵기는 앱 탭바(mobile/app/(tabs)/_layout.tsx)와 같은 값이다.
                  전에는 20px에 활성 2.5 / 비활성 2였는데, 굵기로도 활성을 알리던 것을
                  앱처럼 색 하나로만 알린다 — 같은 탭바가 두 화면에서 다르게 보이면 안 된다. */}
              <Icon className="h-[26px] w-[26px]" strokeWidth={1.75} />
              <span className="text-xs text-gray-500">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
