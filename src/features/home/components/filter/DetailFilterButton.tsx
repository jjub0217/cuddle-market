'use client'

import { ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/commons/button/Button'

interface DetailFilterButtonProps {
  isOpen: boolean
  onToggle: () => void
  filterReset: (e: React.MouseEvent) => void
  ariaControls?: string
}

/**
 * 모바일 전용 세부 필터 토글 헤더.
 * "세부 필터" 토글 버튼 + 필터 초기화 버튼 한 줄.
 * 데스크탑에서는 hidden.
 */
export function DetailFilterButton({ isOpen, onToggle, filterReset, ariaControls }: DetailFilterButtonProps) {
  return (
    <div className="flex items-center justify-between md:hidden">
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={onToggle}
        className="cursor-pointer gap-2 p-0 font-bold text-gray-900 hover:no-underline"
        aria-expanded={isOpen}
        aria-controls={ariaControls}
      >
        세부 필터
        <ChevronDown
          size={18}
          className={cn('transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={filterReset}
        className="cursor-pointer gap-1 p-0 text-xs font-medium text-gray-500 hover:text-[#825500] hover:no-underline"
      >
        <RotateCcw size={12} aria-hidden="true" />
        필터 초기화
      </Button>
    </div>
  )
}
