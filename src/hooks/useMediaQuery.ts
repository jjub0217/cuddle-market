import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string, defaultValue = false): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', callback)
      return () => mediaQuery.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => defaultValue
  )
}
