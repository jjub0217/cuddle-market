import { cn } from '@/lib/utils/cn'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
}

export default function Spinner({ size = 'md', className, label = '로딩 중' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'border-outline-variant border-t-primary-container animate-spin rounded-full',
        SIZE_CLASSES[size],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  )
}
