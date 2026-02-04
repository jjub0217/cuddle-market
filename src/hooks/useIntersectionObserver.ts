import { useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
  enabled: boolean // 감지 기능 활성화 여부
  hasNextPage?: boolean // 다음 페이지 존재 여부
  isFetchingNextPage: boolean // 현재 로딩중인지 여부
  onIntersect: () => void // 요소가 보일 때 실행할 함수
  threshold?: number // 얼마나 보여야 감지할지
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
      { threshold }
    )

    observer.observe(node)

    return () => {
      if (node) observer.unobserve(node)
      observer.disconnect()
    }
  }, [enabled, hasNextPage, isFetchingNextPage, onIntersect, threshold])

  return targetRef
}