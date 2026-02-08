'use client'

import { usePathname } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ROUTES } from '@/constants/routes'
import Header from '@/components/header/Header'
import type { ReactNode } from 'react'

// ========== 공통 동적 경로 패턴 ==========
const COMMUNITY_DETAIL = /^\/community\/\d+$/
const COMMUNITY_EDIT = /^\/community\/\d+\/edit$/

// Header 숨김 패턴 (모바일에서만 숨김)
const HIDE_HEADER_MOBILE_PATTERNS = [COMMUNITY_DETAIL, COMMUNITY_EDIT, new RegExp(`^${ROUTES.COMMUNITY_POST}$`)]

// SearchBar 숨김 경로 - 모바일만 (정적 경로)
const HIDE_SEARCHBAR_MOBILE_PATHS: string[] = [ROUTES.MYPAGE]

// SearchBar 숨김 경로 - 항상 (정적 경로)
const HIDE_SEARCHBAR_ALWAYS_PATHS: string[] = [
  ROUTES.COMMUNITY,
  ROUTES.COMMUNITY_POST,
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FIND_PASSWORD,
  ROUTES.PROFILE_UPDATE,
  ROUTES.PRODUCT_POST,
  ROUTES.CHAT,
]

// 메뉴 버튼 숨김 경로
const HIDE_MENU_BUTTON_PATHS: string[] = [ROUTES.LOGIN, ROUTES.SIGNUP]

// SearchBar 숨김 패턴 - 모바일만 (동적 경로)
const HIDE_SEARCHBAR_MOBILE_PATTERNS = [/^\/user-profile\/\d+$/]

// SearchBar 숨김 패턴 - 항상 (동적 경로)
const HIDE_SEARCHBAR_ALWAYS_PATTERNS = [COMMUNITY_DETAIL, COMMUNITY_EDIT, /^\/products\/\d+\/edit$/, /^\/chat\/\d+$/]

export default function MainLayout({ children }: { children: ReactNode }) {
  const isXl = useMediaQuery('(min-width: 1280px)')
  const pathname = usePathname()

  const hideHeaderMobile = !isXl && HIDE_HEADER_MOBILE_PATTERNS.some((pattern) => pattern.test(pathname))
  const showHeader = !hideHeaderMobile
  const hideSearchBarMobile =
    !isXl &&
    (HIDE_SEARCHBAR_MOBILE_PATHS.includes(pathname) || HIDE_SEARCHBAR_MOBILE_PATTERNS.some((pattern) => pattern.test(pathname)))
  const hideSearchBarAlways =
    HIDE_SEARCHBAR_ALWAYS_PATHS.includes(pathname) || HIDE_SEARCHBAR_ALWAYS_PATTERNS.some((pattern) => pattern.test(pathname))
  const hideSearchBar = hideSearchBarMobile || hideSearchBarAlways
  const hideMenuButton = HIDE_MENU_BUTTON_PATHS.includes(pathname)

  return (
    <div className="flex min-h-screen flex-col">
      {showHeader && <Header hideSearchBar={hideSearchBar} hideMenuButton={hideMenuButton} />}
      <main
        className="w-full flex-1 transition-[padding-top] duration-300"
        style={{ paddingTop: showHeader ? 'var(--header-height, 72px)' : '0' }}
      >
        {children}
      </main>
    </div>
  )
}
