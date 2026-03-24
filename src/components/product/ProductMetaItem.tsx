import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ProductMetaItemProps {
  icon: LucideIcon
  iconSize?: number
  label: string | number
  className?: string // 색상 커스터마이징
  textClassName?: string
  strokeWidth?: number
}

export function ProductMetaItem({ icon: Icon, label, iconSize = 16, className = 'text-gray-500', textClassName, strokeWidth }: ProductMetaItemProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Icon size={iconSize} strokeWidth={strokeWidth} aria-hidden="true" />
      <span className={cn('text-xs font-semibold whitespace-nowrap', textClassName)}>{label}</span>
    </div>
  )
}
