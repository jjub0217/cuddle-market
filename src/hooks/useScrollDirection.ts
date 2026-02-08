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
      if (isIgnoring.current) return

      const currentScrollY = window.scrollY
      const prevScrollY = lastScrollY.current
      const diff = currentScrollY - prevScrollY

      if (Math.abs(diff) >= threshold) {
        const shouldCollapse = diff > 0
        lastScrollY.current = currentScrollY

        if (shouldCollapse === isCollapsedRef.current) {
          isCollapsedRef.current = shouldCollapse
          setIsCollapsed(shouldCollapse)
          isIgnoring.current = true
          setTimeout(() => {
            isIgnoring.current = false
            lastScrollY.current = window.scrollY
          }, ignoreTime)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold, ignoreTime])

  return { isCollapsed }
}
