import { cn } from '@/lib/utils/cn'
import type { EventStatus } from '@/lib/utils/eventStatus'

// 예정은 테두리만, 진행 중은 색을 채워 가장 눈에 띄게, 종료는 회색(설계 7-2절)
const TONE: Record<EventStatus['kind'], string> = {
  upcoming: 'border border-primary-600 text-primary-600 bg-white',
  ongoing: 'border border-primary-600 bg-primary-600 text-white',
  ended: 'border border-gray-300 bg-gray-100 text-gray-500',
}

interface EventStatusChipProps {
  status: EventStatus
  className?: string
}

export function EventStatusChip({ status, className }: EventStatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs leading-tight font-semibold',
        TONE[status.kind],
        className
      )}
    >
      {status.label}
    </span>
  )
}
