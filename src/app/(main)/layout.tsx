'use client'

import Header from '@/components/header/Header'
import BottomNav from '@/components/bottom-nav/BottomNav'
import { isBottomNavHidden } from '@/components/bottom-nav/isBottomNavHidden'
import { isHeaderHiddenMobile } from '@/components/header/isHeaderHiddenMobile'
import { ROUTES } from '@/constants/routes'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // 탭바가 없는 화면에 그 높이만큼 비켜 주면 아래가 통째로 빈다.
  // 예전에는 여기 목록이 따로 있어 로그인·가입만 알았고, 상품 등록·글쓰기·채팅방 등
  // 여덟 곳 넘게 어긋나 있었다(2026-08-03 실기기에서 발견).
  const noBottomPadding = isBottomNavHidden(pathname)

  // 헤더 높이(72px)만큼 위를 비켜 준다.
  //
  // ⚠️ **예전에는 `style={{ paddingTop: 'var(--header-height, 72px)' }}` 였다**(#614).
  //    그 변수는 Header 의 `useEffect` 안에서 들어와서 **첫 그림에는 없었다.** 그래서
  //    어느 화면이든 72px 로 그려졌다가 뒤늦게 0 으로 줄어 **내용이 위로 점프**했다.
  //    홈과 헤더를 감추는 경로에서 특히 눈에 띄었다.
  //
  //    이제 경로만 보고 클래스로 정한다 — 경로는 **서버도 안다.** 첫 그림부터 맞다.
  //
  //      홈          0     히어로가 헤더 뒤까지 차오른다
  //      감추는 경로   0     좁은 화면에선 헤더가 없다. 넓으면 헤더가 있으니 72
  //      그 밖        72
  //
  // ⚠️ pt-18 = 4.5rem = 72px 이다. 헤더 높이(py-3 + h-12 = 72)와 **같은 값이어야 한다.**
  const isHome = pathname === ROUTES.HOME
  const headerHiddenMobile = isHeaderHiddenMobile(pathname)
  const paddingTopClass = isHome ? 'pt-0' : headerHiddenMobile ? 'pt-0 lg:pt-18' : 'pt-18'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={cn(
          'w-full flex-1 bg-white transition-[padding-top] duration-300 lg:pb-0',
          paddingTopClass,
          noBottomPadding ? 'pb-0' : 'pb-14'
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
