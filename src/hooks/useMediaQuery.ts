import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  // SSR-safe: 항상 false로 시작하여 서버/클라이언트 초기 렌더링 일치
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    // 클라이언트에서 마운트 후 실제 값으로 업데이트
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}
