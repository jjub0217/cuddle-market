'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface FilterNavigation {
  searchParams: URLSearchParams
  pathname: string
  push: (url: string) => void
}

const FilterNavigationContext = createContext<FilterNavigation | null>(null)

export function FilterNavigationProvider({ children }: { children: ReactNode }) {
  const serverParams = useSearchParams()
  const pathname = usePathname()

  // 클라이언트 필터 변경 시 사용되는 내부 state (null = 서버 params 사용)
  const [clientParams, setClientParams] = useState<URLSearchParams | null>(null)

  // 서버 params 변경 감지 (다른 페이지에서 홈으로 Link 네비게이션 시)
  const [prevServerParams, setPrevServerParams] = useState(serverParams)
  if (serverParams !== prevServerParams) {
    setPrevServerParams(serverParams)
    setClientParams(null)
  }

  const searchParams = clientParams ?? serverParams

  const push = useCallback((url: string) => {
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (url === currentUrl) return
    window.history.pushState(null, '', url)
    const urlObj = new URL(url, window.location.origin)
    setClientParams(new URLSearchParams(urlObj.search))
  }, [])

  // 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      setClientParams(new URLSearchParams(window.location.search))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <FilterNavigationContext.Provider value={{ searchParams, pathname, push }}>
      {children}
    </FilterNavigationContext.Provider>
  )
}

/**
 * Provider 내부: pushState로 빠른 클라이언트 네비게이션
 * Provider 외부: Next.js router fallback (공유 컴포넌트용)
 */
export function useFilterNavigation(): FilterNavigation {
  const ctx = useContext(FilterNavigationContext)
  const serverSearchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  if (ctx) return ctx

  return {
    searchParams: serverSearchParams,
    pathname,
    push: (url: string) => router.push(url),
  }
}
