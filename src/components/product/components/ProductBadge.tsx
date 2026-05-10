import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'

export type ProductBadgeTone = 'primary' | 'light' | 'info' | 'warning' | 'outline'
export type ProductBadgeSize = 'sm' | 'md'

const TONE_BASE = 'rounded font-bold'

const SIZE_CLASSES: Record<ProductBadgeSize, string> = {
  // 메인 카드/리스트용 (작음)
  sm: 'px-2 py-0.5 text-[10px]',
  // 상세페이지용 (살짝 큼)
  md: 'px-2.5 py-1 text-xs',
}

const TONE_CLASSES: Record<ProductBadgeTone, string> = {
  // 진한 브라운 채움 (펫 타입 등)
  primary: 'bg-primary-700 text-white',
  // 연한 브라운 채움 (상품 상태 등)
  light: 'bg-primary-200 text-gray-900',
  // 블루 톤 (판매)
  info: 'bg-[#cbe2fa] text-[#33495c]',
  // 앰버 톤 (판매요청)
  warning: 'border border-[#f0d9a8] bg-[#fff5e0] text-[#825500]',
  // 아웃라인 (상품상태/카테고리 등)
  outline: 'border border-[#d4c4b2] bg-transparent text-gray-600',
}

export interface ProductBadgeItem {
  label: string
  tone: ProductBadgeTone
}

interface ProductBadgeProps {
  items: ProductBadgeItem[]
  size?: ProductBadgeSize
  className?: string
}

export function ProductBadge({ items, size = 'sm', className }: ProductBadgeProps) {
  if (items.length === 0) return null
  return (
    <div className={cn('z-1 flex flex-wrap items-center gap-xs', className)}>
      {items.map((item, idx) => (
        <Badge
          key={`${item.label}-${idx}`}
          className={cn('whitespace-nowrap', TONE_BASE, SIZE_CLASSES[size], TONE_CLASSES[item.tone])}
        >
          {item.label}
        </Badge>
      ))}
    </div>
  )
}
