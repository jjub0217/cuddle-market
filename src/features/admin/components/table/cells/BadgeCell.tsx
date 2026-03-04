import { cn } from '@/lib/utils/cn'
import type { BadgeOption } from '@/features/admin/types/adminTable'

interface BadgeCellProps {
  value: string
  options?: BadgeOption[]
}

const DEFAULT_COLOR = 'bg-gray-100 text-gray-800'

export default function BadgeCell({ value, options }: BadgeCellProps) {
  const option = options?.find((o) => o.value === value)
  const colorClass = option?.color ?? DEFAULT_COLOR

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        colorClass,
      )}
    >
      {option?.label ?? value}
    </span>
  )
}
