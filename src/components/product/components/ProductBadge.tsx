import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'

export type ProductBadgeTone = 'primary' | 'light' | 'info' | 'warning' | 'outline'
export type ProductBadgeSize = 'sm' | 'md'

// 알약(rounded-full) + 굵기 600. 앱 뱃지와 같은 모양으로 맞춘 값이다.
const TONE_BASE = 'rounded-full font-semibold'

const SIZE_CLASSES: Record<ProductBadgeSize, string> = {
  // 메인 카드/리스트용 (작음) — 앱 카드 뱃지가 11이라 맞춤
  sm: 'px-2 py-0.5 text-[11px]',
  // 상세페이지용 (살짝 큼)
  md: 'px-2.5 py-1 text-xs',
}

const TONE_CLASSES: Record<ProductBadgeTone, string> = {
  // [현재 실화면 미사용 — 디자인 시스템 팔레트로 보존]
  // 진한 브라운 채움 (펫 타입 등). 필요 시 다시 tone="primary"로 사용.
  primary: 'bg-primary-700 text-white',
  // [현재 실화면 미사용 — 디자인 시스템 팔레트로 보존]
  // 연한 브라운 채움. 상품 상태를 채움형으로 되돌릴 때 tone="light".
  light: 'bg-primary-200 text-gray-900',
  // 블루 톤 (판매) — 토큰: tokens.colors.css의 --color-badge-sell-*
  info: 'bg-badge-sell-bg text-badge-sell-fg',
  // 앰버 톤 (판매요청) — 토큰: tokens.colors.css의 --color-badge-request-*
  warning: 'bg-badge-request-bg text-badge-request-fg',
  // 아웃라인 (상품상태 등) — 앱 뱃지와 같은 회색 외곽선.
  // 테두리 토큰: tokens.colors.css의 --color-badge-status-border
  outline: 'border border-badge-status-border bg-transparent text-gray-500',
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
