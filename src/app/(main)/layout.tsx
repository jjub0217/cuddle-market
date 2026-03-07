import Header from '@/components/header/Header'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className="w-full flex-1 transition-[padding-top] duration-300"
        style={{ paddingTop: 'var(--header-height, 72px)' }}
      >
        {children}
      </main>
    </div>
  )
}
