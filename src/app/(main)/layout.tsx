'use client'

import Header from '@/components/header/Header'
import BottomNav from '@/components/bottom-nav/BottomNav'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

// BottomNav가 숨겨지는 경로는 하단 패딩(pb-14)도 불필요
const NO_BOTTOM_PADDING_PATHS: string[] = [ROUTES.LOGIN, ROUTES.SIGNUP]

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const noBottomPadding = NO_BOTTOM_PADDING_PATHS.includes(pathname)

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
