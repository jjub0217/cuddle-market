'use client'

import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'
import Logo from '../Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Suspense, useEffect, useRef, useState } from 'react'
import IconButton from '@/components/commons/button/IconButton'
import SearchBar from '@/components/header/components/SearchBar'
import { Search } from 'lucide-react'
import UserControls from '@/components/header/components/UserControls'
import MobileNavigation from '@/components/header/components/MobileNavigation'

interface HeaderProps {
  hideSearchBar?: boolean
  hideMenuButton?: boolean
}

export default function Header({ hideSearchBar = false, hideMenuButton = false }: HeaderProps) {
  const isXl = useMediaQuery('(min-width: 1280px)')
  const [isSideOpen, setIsSideOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchBarRef = useRef<HTMLDivElement>(null)
  const [searchBarHeight, setSearchBarHeight] = useState(0)
  const pathname = usePathname()
  const isMarketActive = pathname === '/' || pathname.startsWith('/market')
  const isCommunityActive = pathname.startsWith('/community')

  useEffect(() => {
    if (searchBarRef.current) {
      setSearchBarHeight(searchBarRef.current.scrollHeight)
    }
  }, [])

  // 헤더 높이를 CSS 변수로 설정 (검색바 열림/닫힘에 따라)
  useEffect(() => {
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
  }, [isSearchOpen, searchBarHeight, isXl])

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
              {isXl && (
                <>
                  <Link
                    href={ROUTES.HOME}
                    className={cn('text-md font-extrabold', isMarketActive ? 'border-white text-white' : 'text-gray-700')}
                  >
                    마켓
                  </Link>
                  <Link
                    href={ROUTES.COMMUNITY}
                    className={cn('text-md font-extrabold', isCommunityActive ? 'border-white text-white' : 'text-gray-700')}
                  >
                    커뮤니티
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center gap-1 xl:gap-8">
              {!hideSearchBar && (
                <Suspense>
                  <SearchBar className="hidden md:h-9 xl:block" inputClass="text-sm py-0" />
                </Suspense>
              )}
              {!hideSearchBar && !isXl && (
                <IconButton aria-label="검색" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                  <Search className="text-white" />
                </IconButton>
              )}
              <UserControls isSideOpen={isSideOpen} setIsSideOpen={setIsSideOpen} hideMenuButton={hideMenuButton} />
            </div>
          </div>
          {/* 모바일 검색바 - 아코디언 */}
          {!hideSearchBar && (
            <div
              ref={searchBarRef}
              className="overflow-hidden transition-all duration-300 xl:hidden"
              style={{
                height: isSearchOpen ? `${searchBarHeight}px` : '0',
                marginTop: isSearchOpen ? '12px' : '0',
                marginBottom: isSearchOpen ? '12px' : '0',
              }}
            >
              <Suspense>
                <SearchBar className="h-8 xl:hidden" inputClass="py-1 text-sm" />
              </Suspense>
            </div>
          )}
        </div>
      </header>
      <MobileNavigation isOpen={isSideOpen} onClose={() => setIsSideOpen(false)} />
    </>
  )
}
