'use client'

import { Button } from '../../../../components/commons/button/Button'
import { PET_TYPE_TABS, type PetTypeTabId } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useRef, useState, useEffect } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface ProductPetTypeTabsProps {
  activeTab: PetTypeTabId
  onTabChange: (tabId: PetTypeTabId) => void
}

export function ProductPetTypeTabs({ activeTab, onTabChange }: ProductPetTypeTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showFade, setShowFade] = useState(true)
  const isMd = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      setShowFade(!isAtEnd)
    }

    handleScroll()
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="반려동물 타입 대분류"
        className={cn('border-b-primary-200 scrollbar-hide flex gap-1.5 overflow-x-auto pb-1 md:gap-2.5 md:overflow-visible md:border-b-2')}
      >
        {PET_TYPE_TABS.map((tab) => (
          <Button
            key={tab.id}
            size={isMd ? 'md' : 'sm'}
            id={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'bg-primary-100 text-md flex-1 cursor-pointer rounded-full py-1.5 whitespace-nowrap xl:rounded-2xl xl:bg-white xl:whitespace-normal',
              activeTab === tab.id ? 'bg-primary-500 xl:bg-primary-300 font-bold text-white' : 'hover:bg-primary-100 text-gray-900'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.code}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {showFade && (
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-linear-to-l from-white via-white/80 to-transparent md:hidden" />
      )}
    </div>
  )
}
