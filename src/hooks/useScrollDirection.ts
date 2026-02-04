import { useState, useEffect, useRef } from 'react'

interface UseScrollDirectionOptions {
  threshold?: number
  ignoreTime?: number
}

export function useScrollDirection({ threshold = 10, ignoreTime = 300 }: UseScrollDirectionOptions = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const lastScrollY = useRef(0)
  const isIgnoring = useRef(false)
  const isCollapsedRef = useRef(false)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      // 상태 변경 후 일정 시간 동안 스크롤 이벤트 무시
      if (isIgnoring.current) {
        return
      }

      const currentScrollY = window.scrollY
      const prevScrollY = lastScrollY.current
      const diff = currentScrollY - prevScrollY

      // threshold 이상 스크롤했을 때만 상태 변경
      if (Math.abs(diff) >= threshold) {
        const shouldCollapse = diff > 0

        // 이미 원하는 상태면 lastScrollY만 업데이트하고 리턴
        if (shouldCollapse === isCollapsedRef.current) {
          lastScrollY.current = currentScrollY
          return
        }

        // 상태 변경 전에 무시 플래그 설정
        isIgnoring.current = true
        isCollapsedRef.current = shouldCollapse

        setIsCollapsed(shouldCollapse)

        // ignoreTime 후에 다시 스크롤 이벤트 처리
        setTimeout(() => {
          isIgnoring.current = false
          lastScrollY.current = window.scrollY
        }, ignoreTime)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold, ignoreTime])

  return { isCollapsed }
}
