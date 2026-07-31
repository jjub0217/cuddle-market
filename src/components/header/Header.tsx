'use client'

import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'
import Logo from '../Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import IconButton from '@/components/commons/button/IconButton'
import SearchBar from '@/components/header/components/SearchBar'
import MobileSearchOverlay from '@/components/header/components/MobileSearchOverlay'
import { Search } from 'lucide-react'
import UserControls from '@/components/header/components/UserControls'
import MobileNavigation from '@/components/header/components/MobileNavigation'
import MobileNotificationsOverlay from '@/components/header/components/MobileNotificationsOverlay'

// ========== 공통 동적 경로 패턴 ==========
const COMMUNITY_DETAIL = /^\/community\/\d+(\/[^/]+)?$/
const COMMUNITY_EDIT = /^\/community\/\d+\/edit$/
const PRODUCT_EDIT = /^\/products\/\d+\/edit$/

// Header 숨김 패턴 (모바일에서만 숨김)
const CHAT_ROOM = /^\/chat(\/\d+)?$/
const HIDE_HEADER_MOBILE_PATTERNS = [
  COMMUNITY_EDIT,
  PRODUCT_EDIT,
  CHAT_ROOM,
  new RegExp(`^${ROUTES.COMMUNITY_POST}$`),
  new RegExp(`^${ROUTES.PRODUCT_POST}$`),
  new RegExp(`^${ROUTES.NOTIFICATIONS}$`),
  new RegExp(`^${ROUTES.LOGIN}$`),
  new RegExp(`^${ROUTES.SIGNUP}$`),
]

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

// 미니멀 헤더 경로 (로고만 표시)
const MINIMAL_HEADER_PATHS: string[] = [ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.FIND_PASSWORD]

// SearchBar 숨김 패턴 - 모바일만 (동적 경로)
const HIDE_SEARCHBAR_MOBILE_PATTERNS = [/^\/user-profile\/\d+$/]

// SearchBar 숨김 패턴 - 항상 (동적 경로)
const HIDE_SEARCHBAR_ALWAYS_PATTERNS = [COMMUNITY_DETAIL, COMMUNITY_EDIT, /^\/products\/\d+\/edit$/, /^\/chat\/\d+$/]

// 홈 페이지에서 hero를 헤더 뒤로 깔기 위한 스크롤 임계값 (px)
// 80px 정도 스크롤하면 솔리드 배경으로 전환 — 헤더 자신의 높이만큼
const SOLID_BG_SCROLL_THRESHOLD = 60

// useSyncExternalStore용 subscribe 함수 (모듈 스코프 — 안정적 참조)
const subscribeToScroll = (callback: () => void) => {
  window.addEventListener('scroll', callback, { passive: true })
  return () => window.removeEventListener('scroll', callback)
}

const getScrollPastSnapshot = () => window.scrollY > SOLID_BG_SCROLL_THRESHOLD
const getScrollServerSnapshot = () => false

export default function Header() {
  const isXl = useMediaQuery('(min-width: 1280px)')
  const [isSideOpen, setIsSideOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
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
  const isMinimalHeader = MINIMAL_HEADER_PATHS.includes(pathname)

  const isHome = pathname === ROUTES.HOME
  const isMarketActive = pathname === '/' || pathname.startsWith('/market')
  const isCommunityActive = pathname.startsWith('/community')
  const isMapActive = pathname.startsWith('/map')

  // 스크롤 위치를 외부 스토어로 구독 (useSyncExternalStore — hydration-safe, cascade render 없음)
  const scrolledPast = useSyncExternalStore(subscribeToScroll, getScrollPastSnapshot, getScrollServerSnapshot)

  // 비-홈 페이지는 항상 솔리드, 홈은 스크롤 임계값 통과 시 솔리드
  const showSolid = !isHome || scrolledPast

  // hero CTA 등 외부에서 모바일 검색 아코디언을 열기 위한 이벤트 리스너
  useEffect(() => {
    const openMobileSearch = () => setIsSearchOpen(true)
    window.addEventListener('cuddle:open-search', openMobileSearch)
    return () => window.removeEventListener('cuddle:open-search', openMobileSearch)
  }, [])

  // 헤더 높이를 CSS 변수로 설정
  // 홈 페이지에서는 0으로 설정해 hero가 헤더 뒤까지 차오르도록 함
  useEffect(() => {
    if (!showHeader) {
      document.documentElement.style.setProperty('--header-height', '0px')
      return () => {
        document.documentElement.style.removeProperty('--header-height')
      }
    }

    const baseHeight = 72

    let nextHeight: number
    if (isHome) {
      // 홈: hero가 헤더 영역까지 차지하도록 padding-top 0
      nextHeight = 0
    } else {
      nextHeight = baseHeight
    }

    document.documentElement.style.setProperty('--header-height', `${nextHeight}px`)

    return () => {
      document.documentElement.style.removeProperty('--header-height')
    }
  }, [showHeader, isHome])

  if (!showHeader) return null

  return (
    <>
      <header
        className={cn(
          'fixed top-0 flex w-full items-center justify-center py-3 transition-colors duration-300',
          // 홈 페이지 상단: 투명 (hero 위에 떠있음). 그 외: 솔리드 (cream bg + 보더)
          showSolid
            ? 'border-outline-variant/40 bg-surface/95 border-b backdrop-blur-sm'
            : isHome
              ? 'bg-hero-surface'
              : 'bg-transparent',
          Z_INDEX.HEADER
        )}
      >
        <div className="flex w-full flex-col px-4 xl:block xl:max-w-7xl xl:gap-3 xl:px-3.5">
          <div className="flex h-12 items-center gap-4 xl:gap-8">
            {/* 왼쪽: 로고 + 데스크탑 메뉴 */}
            <div className="flex shrink-0 items-center gap-8 xl:gap-12">
              <Logo />
              {isXl && !isMinimalHeader ? (
                <nav className="flex items-center gap-8" aria-label="주 메뉴">
                  <Link
                    href={ROUTES.HOME}
                    className={cn(
                      'pb-1 text-sm font-semibold transition-colors',
                      isMarketActive ? 'border-primary text-primary border-b-2' : 'text-primary/70 hover:text-primary'
                    )}
                  >
                    중고거래
                  </Link>
                  <Link
                    href={ROUTES.COMMUNITY}
                    className={cn(
                      'pb-1 text-sm font-semibold transition-colors',
                      isCommunityActive ? 'border-primary text-primary border-b-2' : 'text-primary/70 hover:text-primary'
                    )}
                  >
                    질문·정보
                  </Link>
                  <Link
                    href={ROUTES.MAP}
                    className={cn(
                      'pb-1 text-sm font-semibold transition-colors',
                      isMapActive ? 'border-primary text-primary border-b-2' : 'text-primary/70 hover:text-primary'
                    )}
                  >
                    펫지도
                  </Link>
                </nav>
              ) : null}
            </div>

            {/* 가운데: 검색바 (xl+에서 중앙 배치). 검색바가 숨겨진 경우엔 spacer로 우측 컨트롤을 끝으로 push */}
            {!hideSearchBar && isXl ? (
              <div className="mx-auto max-w-130 flex-1">
                <Suspense>
                  <SearchBar
                    id="search-desktop"
                    className="h-10"
                    inputClass="text-sm py-0 bg-white"
                    wrapperClassName={cn('rounded-full bg-white', showSolid ? 'border border-[#bfa890]/40' : 'border-0')}
                  />
                </Suspense>
              </div>
            ) : (
              <div className="flex-1" aria-hidden="true" />
            )}

            {/* 오른쪽: 검색 토글(모바일) + 사용자 컨트롤 — 미니멀 헤더에서는 숨김 */}
            {!isMinimalHeader ? (
              <div className="flex shrink-0 items-center gap-1 xl:gap-4">
                {!hideSearchBar && !isXl ? (
                  <IconButton aria-label="검색" onClick={() => setIsSearchOpen((prev) => !prev)}>
                    <Search className="text-primary" />
                  </IconButton>
                ) : null}
                <UserControls
                  isSideOpen={isSideOpen}
                  setIsSideOpen={setIsSideOpen}
                  hideMenuButton={hideMenuButton}
                  onOpenMobileNotifications={() => setIsNotificationsOpen(true)}
                />
              </div>
            ) : null}
          </div>

        </div>
      </header>
      {!hideSearchBar ? (
        <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      ) : null}
      <MobileNavigation isOpen={isSideOpen} onClose={() => setIsSideOpen(false)} />
      {/* ⚠️ 전체화면 오버레이는 반드시 </header> 밖에 둔다.
          헤더에는 backdrop-blur-sm(기준 상자를 만든다)과 z-30(쌓임 맥락을 만든다)이
          걸려 있어서, 안에 두면 fixed inset-0이 헤더 높이로 잘리고 z-[100]도 무시된다(#804). */}
      <MobileNotificationsOverlay isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  )
}
