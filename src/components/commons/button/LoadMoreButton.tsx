import { cn } from '@/lib/utils/cn'

interface LoadMoreButtonProps {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  text?: string
  classname?: string
}

export function LoadMoreButton({
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = '로딩중...',
  text = '더보기',
  classname,
}: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'bg-primary-200 hover:bg-primary-400 w-full cursor-pointer rounded-lg border py-2 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50',
        classname
      )}
    >
      {isLoading ? loadingText : text}
    </button>
  )
}
