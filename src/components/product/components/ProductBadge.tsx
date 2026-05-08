import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'

export type ProductBadgeTone = 'primary' | 'light' | 'info' | 'warning' | 'outline'

const TONE_CLASSES: Record<ProductBadgeTone, string> = {
  // 기존 ProductListItem 디자인 (진한 브라운 채움)
  primary: 'rounded-md bg-primary-700 px-1.5 py-1 text-[11px] font-semibold text-white',
  // 기존 ProductListItem 디자인 (연한 채움)
  light: 'rounded-md bg-primary-200 px-1.5 py-1 text-[11px] font-semibold text-gray-900',
  // 새 디자인 판매 (블루 톤)
  info: 'rounded bg-[#cbe2fa] px-2 py-0.5 text-[10px] font-bold text-[#33495c]',
  // 새 디자인 판매요청 (앰버 톤)
  warning: 'rounded border border-[#f0d9a8] bg-[#fff5e0] px-2 py-0.5 text-[10px] font-bold text-[#825500]',
  // 새 디자인 상품상태 (아웃라인)
  outline: 'rounded border border-[#d4c4b2] bg-transparent px-2 py-0.5 text-[10px] font-bold text-gray-600',
}

export interface ProductBadgeItem {
  label: string
  tone: ProductBadgeTone
}

interface ProductBadgeProps {
  items: ProductBadgeItem[]
  className?: string
}

export function ProductBadge({ items, className }: ProductBadgeProps) {
  if (items.length === 0) return null
  return (
    <div className={cn('z-1 flex flex-wrap items-center gap-xs', className)}>
      {items.map((item, idx) => (
        <Badge key={`${item.label}-${idx}`} className={cn('whitespace-nowrap', TONE_CLASSES[item.tone])}>
          {item.label}
        </Badge>
      ))}
    </div>
  )
}
