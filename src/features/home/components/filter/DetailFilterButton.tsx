'use client'

import { Funnel as FilterIcon, ChevronDown as DownArrow } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/commons/button/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface DetailFilterToggleProps {
  isOpen: boolean
  onClick: () => void
  ariaControls?: string
  filterReset: (e: React.MouseEvent) => void
}

export function DetailFilterButton({ isOpen, onClick, ariaControls, filterReset }: DetailFilterToggleProps) {
  const isMd = useMediaQuery('(min-width: 768px)')
  return (
    <div
      role="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={0}
      aria-expanded={isOpen}
      aria-controls={ariaControls}
      aria-label={isOpen ? '세부 필터 닫기' : '세부 필터 열기'}
      className={cn('bg-primary-100 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-all')}
    >
      <div className={cn('flex items-center gap-2')}>
        <FilterIcon className={cn('h-4 w-4')} aria-hidden="true" />
        <span className={cn('font-sm font-bold')}>세부 필터</span>
        {isMd && (
          <p className={cn('bg-primary-50 items-center justify-center overflow-hidden rounded-md px-3 py-1 text-sm')} aria-hidden="true">
            상품상태 · 가격대 · 지역
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button size="xs" type="button" className="bg-primary-50 cursor-pointer" onClick={filterReset}>
          필터 초기화
        </Button>
        <DownArrow className={cn('h-6 w-6 text-gray-900 transition-transform', isOpen && 'rotate-180')} strokeWidth={2} aria-hidden="true" />
      </div>
    </div>
  )
}
