import Header from '@/components/header/Header'
import BottomNav from '@/components/bottom-nav/BottomNav'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className="w-full flex-1 bg-white pb-14 transition-[padding-top] duration-300 xl:pb-0"
        style={{ paddingTop: 'var(--header-height, 72px)' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
