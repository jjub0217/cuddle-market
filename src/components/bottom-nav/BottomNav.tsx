'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UsersRound, MapPin, MessageCircleMore, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/constants/routes'
import { isBottomNavHidden } from './isBottomNavHidden'
import { Z_INDEX } from '@/constants/ui'

const NAV_ITEMS = [
  { href: ROUTES.HOME, label: '홈', icon: Home, match: (p: string) => p === '/' || p.startsWith('/market') },
  { href: ROUTES.COMMUNITY, label: '커뮤니티', icon: UsersRound, match: (p: string) => p.startsWith('/community') },
  { href: ROUTES.MAP, label: '플레이스', icon: MapPin, match: (p: string) => p.startsWith('/map') },
  { href: ROUTES.CHAT, label: '채팅', icon: MessageCircleMore, match: (p: string) => p.startsWith('/chat') },
  { href: ROUTES.MYPAGE, label: '마이', icon: UserRound, match: (p: string) => p.startsWith('/mypage') },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  // 규칙은 isBottomNavHidden 한 곳에 있다 — (main)/layout도 같은 답을 써서
  // 탭바 높이만큼 아래를 비켜 줄지 정한다.
  const shouldHide = isBottomNavHidden(pathname)

  if (shouldHide) return null

  return (
    <nav
      className={cn(
        // ⚠️ **넓은 화면에서 숨기는 일을 CSS 에 맡긴다. 자바스크립트로 되돌리지 마라**(#614).
        //    예전에는 `useMediaQuery('(min-width: 1280px)')` 로 재서 `return null` 했는데,
        //    **서버에는 window 가 없어 늘 「좁다」로 답한다.** 그래서 서버가 **탭바를 그린
        //    HTML** 을 보내고, 데스크탑에서는 하이드레이션이 끝나야 사라졌다 —
        //    **새로고침할 때마다 없어야 할 것이 잠깐 보였다**(맥 크롬에서 확인).
        //    CSS 로 숨기면 첫 그림부터 맞다.
        //
        //    아래 여백도 이미 CSS 가 맞춘다 — (main)/layout.tsx 의 `pb-14 lg:pb-0`.
        //    ⚠️ **둘은 같은 값이어야 한다.** 다르면 탭바가 없는데 아래가 비거나 그 반대가 된다.
        'fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden',
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
