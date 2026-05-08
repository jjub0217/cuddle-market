import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ProductMetaItemProps {
  icon?: LucideIcon // 선택값 — 없으면 텍스트만 렌더링
  iconSize?: number
  label: string | number
  className?: string // 래퍼 색상 커스터마이징 (currentColor 상속 기준점)
  textClassName?: string
  iconClassName?: string // 아이콘 자체 추가 클래스 (fill, stroke 등)
  strokeWidth?: number
}

export function ProductMetaItem({
  icon: Icon,
  label,
  iconSize = 16,
  className = 'text-gray-500',
  textClassName,
  iconClassName,
  strokeWidth,
}: ProductMetaItemProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Icon ? <Icon size={iconSize} strokeWidth={strokeWidth} className={iconClassName} aria-hidden="true" /> : null}
      <span className={cn('text-xs font-semibold whitespace-nowrap', textClassName)}>{label}</span>
    </div>
  )
}
