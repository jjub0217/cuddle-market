import { useCallback, useEffect, useState } from 'react'

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
  // ⚠️ 여기를 useRef 로 되돌리지 마라 (#939). ref 는 바뀌어도 다시 그리지 않으니
  // 효과의 의존 배열에 못 넣는다. 그러면 감시 대상이 화면에 늦게 나타나는 화면에서
  // 「효과는 이미 돌았고 그때는 마디가 없었다」로 끝나 observe() 가 영영 안 불린다.
  // 실제로 홈이 그랬다 — 서버가 심어 준 첫 페이지로 시작하면 enabled 가 처음부터 true 라
  // 의존값이 하나도 안 바뀌고, 스토어 복원(_hasHydrated) 전 그림에서는 센티넬이 없어서
  // 새로고침 뒤 아무리 스크롤해도 다음 페이지를 안 불러왔다.
  // state 로 잡으면 마디가 붙는 순간 다시 그려져 효과가 그때 한 번 더 돈다.
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const targetRef = useCallback((element: HTMLDivElement | null) => {
    setNode(element)
  }, [])

  useEffect(() => {
    if (!enabled) return
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
      observer.unobserve(node)
      observer.disconnect()
    }
  }, [enabled, node, hasNextPage, isFetchingNextPage, onIntersect, threshold])

  return targetRef
}
