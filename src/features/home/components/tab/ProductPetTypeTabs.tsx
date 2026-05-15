'use client'

import { PET_TYPE_TABS, type PetTypeTabId } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useRef, useState, useEffect } from 'react'
import Button from '@/components/commons/button/Button'

interface ProductPetTypeTabsProps {
  activeTab: PetTypeTabId
  onTabChange: (tabId: PetTypeTabId) => void
}

export function ProductPetTypeTabs({ activeTab, onTabChange }: ProductPetTypeTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showFade, setShowFade] = useState(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const recomputeFade = () => {
      const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      setShowFade(!isAtEnd)
    }

    const rafId = requestAnimationFrame(recomputeFade)
    el.addEventListener('scroll', recomputeFade, { passive: true })
    // 뷰포트 변경 시 scrollWidth/clientWidth가 달라질 수 있어 재계산
    window.addEventListener('resize', recomputeFade)
    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', recomputeFade)
      window.removeEventListener('resize', recomputeFade)
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="반려동물 타입 대분류"
        className="scrollbar-hide border-outline-variant flex overflow-x-auto border-b"
      >
        {PET_TYPE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              id={tab.id}
              type="button"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                '-mb-px cursor-pointer rounded-none border-b-2 px-3 pt-3 pb-1 whitespace-nowrap md:px-3 md:pb-3',
                isActive
                  ? 'border-[#825500] font-bold text-[#825500]'
                  : 'border-transparent font-medium text-gray-500 hover:text-[#825500]'
              )}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.code}`}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>
      {showFade ? (
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-linear-to-l from-white via-white/80 to-transparent md:hidden" />
      ) : null}
    </div>
  )
}
