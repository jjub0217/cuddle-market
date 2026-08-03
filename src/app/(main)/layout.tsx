'use client'

import Header from '@/components/header/Header'
import BottomNav from '@/components/bottom-nav/BottomNav'
import { isBottomNavHidden } from '@/components/bottom-nav/isBottomNavHidden'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // 탭바가 없는 화면에 그 높이만큼 비켜 주면 아래가 통째로 빈다.
  // 예전에는 여기 목록이 따로 있어 로그인·가입만 알았고, 상품 등록·글쓰기·채팅방 등
  // 여덟 곳 넘게 어긋나 있었다(2026-08-03 실기기에서 발견).
  const noBottomPadding = isBottomNavHidden(pathname)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={cn(
          'w-full flex-1 bg-white transition-[padding-top] duration-300 xl:pb-0',
          noBottomPadding ? 'pb-0' : 'pb-14'
        )}
        style={{ paddingTop: 'var(--header-height, 72px)' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
