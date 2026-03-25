'use client'

import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'
import Logo from '../Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Suspense, useEffect, useState } from 'react'
import IconButton from '@/components/commons/button/IconButton'
import SearchBar from '@/components/header/components/SearchBar'
import { Search } from 'lucide-react'
import UserControls from '@/components/header/components/UserControls'
import MobileNavigation from '@/components/header/components/MobileNavigation'

// ========== 공통 동적 경로 패턴 ==========
const COMMUNITY_DETAIL = /^\/community\/\d+$/
const COMMUNITY_EDIT = /^\/community\/\d+\/edit$/

// Header 숨김 패턴 (모바일에서만 숨김)
const HIDE_HEADER_MOBILE_PATTERNS = [COMMUNITY_DETAIL, COMMUNITY_EDIT, new RegExp(`^${ROUTES.COMMUNITY_POST}$`), new RegExp(`^${ROUTES.NOTIFICATIONS}$`)]

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

export default function Header() {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => { setIsHydrated(true) }, [])
  const isXl = useMediaQuery('(min-width: 1280px)')
  const [isSideOpen, setIsSideOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  // 검색바 높이: h-8(32px) 고정 디자인이므로 상수 사용 (scrollHeight 접근에 의한 강제 리플로우 방지)
  const searchBarHeight = 40
  const pathname = usePathname()

  // 가시성 계산
  const hideHeaderMobile = !isXl && HIDE_HEADER_MOBILE_PATTERNS.some((pattern) => pattern.test(pathname))
  const showHeader = !hideHeaderMobile
  const hideSearchBarMobile =
    !isXl &&
    (HIDE_SEARCHBAR_MOBILE_PATHS.includes(pathname) || HIDE_SEARCHBAR_MOBILE_PATTERNS.some((pattern) => pattern.test(pathname)))
  const hideSearchBarAlways =
    HIDE_SEARCHBAR_ALWAYS_PATHS.includes(pathname) || HIDE_SEARCHBAR_ALWAYS_PATTERNS.some((pattern) => pattern.test(pathname))
  const hideSearchBar = hideSearchBarMobile || hideSearchBarAlways
  const hideMenuButton = HIDE_MENU_BUTTON_PATHS.includes(pathname)

  const isMarketActive = pathname === '/' || pathname.startsWith('/market')
  const isCommunityActive = pathname.startsWith('/community')

  // 헤더 높이를 CSS 변수로 설정 (검색바 열림/닫힘 및 헤더 가시성에 따라)
  useEffect(() => {
    if (!showHeader) {
      document.documentElement.style.setProperty('--header-height', '0px')
      return () => {
        document.documentElement.style.removeProperty('--header-height')
      }
    }

    // 기본 헤더 높이: pt-3(12px) + h-12(48px) + pb-3(12px) = 72px
    // 검색바 열림 시: 72px + marginTop(12px) + searchBarHeight + marginBottom(12px)
    const baseHeight = 72
    const expandedHeight = baseHeight + 12 + searchBarHeight + 12

    if (!isXl && isSearchOpen) {
      document.documentElement.style.setProperty('--header-height', `${expandedHeight}px`)
    } else {
      document.documentElement.style.setProperty('--header-height', `${baseHeight}px`)
    }

    return () => {
      document.documentElement.style.removeProperty('--header-height')
    }
  }, [showHeader, isSearchOpen, isXl])

  if (!showHeader) return null

  if (!isHydrated) {
    return (
      <header className={cn('bg-primary-200 fixed top-0 flex w-full items-center justify-center pt-3 pb-3', Z_INDEX.HEADER)}>
        <div className="flex w-full flex-col px-4 xl:block xl:max-w-7xl xl:px-3.5">
          <div className="flex h-12 items-center">
            <Logo />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header
        className={cn(
          'bg-primary-200 fixed top-0 flex w-full items-center justify-center pt-3 xl:pb-3',
          !isXl && (isSearchOpen ? 'pb-0' : 'pb-3'),
          Z_INDEX.HEADER
        )}
      >
        <div className="flex w-full flex-col px-4 xl:block xl:max-w-7xl xl:gap-3 xl:px-3.5">
          <div className="flex h-12 items-center justify-between gap-4">
            <nav className="flex items-center gap-8" aria-label="주 메뉴">
              <Logo />
              {isXl ? (
                <>
                  <Link
                    href={ROUTES.HOME}
                    className={cn('text-md font-medium', isMarketActive ? 'border-white text-white' : 'text-gray-700')}
                  >
                    마켓
                  </Link>
                  <Link
                    href={ROUTES.COMMUNITY}
                    className={cn('text-md font-medium', isCommunityActive ? 'border-white text-white' : 'text-gray-700')}
                  >
                    커뮤니티
                  </Link>
                </>
              ) : null}
            </nav>
            <div className="flex items-center gap-1 xl:gap-8">
              {!hideSearchBar ? (
                <Suspense>
                  <SearchBar id="search-desktop" className="hidden md:h-9 xl:block" inputClass="text-sm py-0" />
                </Suspense>
              ) : null}
              {!hideSearchBar && !isXl ? (
                <IconButton aria-label="검색" onClick={() => setIsSearchOpen((prev) => !prev)}>
                  <Search className="text-white" />
                </IconButton>
              ) : null}
              <UserControls isSideOpen={isSideOpen} setIsSideOpen={setIsSideOpen} hideMenuButton={hideMenuButton} />
            </div>
          </div>
          {/* 모바일 검색바 - 아코디언 */}
          {!hideSearchBar ? (
            <div
              className="overflow-hidden transition-all duration-300 xl:hidden"
              style={{
                height: isSearchOpen ? `${searchBarHeight}px` : '0',
                marginTop: isSearchOpen ? '12px' : '0',
                marginBottom: isSearchOpen ? '12px' : '0',
              }}
            >
              <Suspense>
                <SearchBar id="search-mobile" className="h-10 xl:hidden" inputClass="py-1 text-[15px]" />
              </Suspense>
            </div>
          ) : null}
        </div>
      </header>
      <MobileNavigation isOpen={isSideOpen} onClose={() => setIsSideOpen(false)} />
    </>
  )
}
