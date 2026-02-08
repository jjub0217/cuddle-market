import { useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
  enabled: boolean
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  onIntersect: () => void
  threshold?: number
}

export function useIntersectionObserver({
  enabled,
  hasNextPage,
  isFetchingNextPage,
  onIntersect,
  threshold,
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    const node = targetRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onIntersect()
        }
      },
      { threshold },
    )

    observer.observe(node)

    return () => {
      if (node) observer.unobserve(node)
      observer.disconnect()
    }
  }, [enabled, hasNextPage, isFetchingNextPage, onIntersect, threshold])

  return targetRef
}
