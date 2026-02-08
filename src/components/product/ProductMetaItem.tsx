import type { LucideIcon } from 'lucide-react'

interface ProductMetaItemProps {
  icon: LucideIcon
  iconSize?: number
  label: string | number
  className?: string // 색상 커스터마이징
}

export function ProductMetaItem({ icon: Icon, label, iconSize = 16, className = 'text-gray-500' }: ProductMetaItemProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Icon size={iconSize} aria-hidden="true" />
      <span className="font-medium whitespace-nowrap lg:text-sm">{label}</span>
    </div>
  )
}
