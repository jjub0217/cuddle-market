'use client'

import { cn } from '@/lib/utils/cn'

interface LoadMoreButtonProps {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  text?: string
  className?: string
}

export function LoadMoreButton({
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = '로딩중...',
  text = '더보기',
  className,
}: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      type="button"
      className={cn(
        'bg-primary-200 hover:bg-primary-400 w-full cursor-pointer rounded-lg border py-2 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {isLoading ? loadingText : text}
    </button>
  )
}
