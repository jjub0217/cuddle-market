import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: string
  className?: string
}

/**
 * 뱃지 한 알.
 *
 * 기본값은 **앱 카드 뱃지와 같은 값**이다 — 알약 모양 · 글자 11 · 굵기 600
 * (mobile/components/product-card.tsx 의 badgeText). ProductBadge 의 sm 과도 같다.
 *
 * ⚠️ 전에는 `rounded-md px-2 py-1 text-sm`(네모 · 14)이었다. 이 기본값이 그대로 보이는 곳은
 *    StaticHomeFallback 하나였는데, 그 화면은 SSR 로 **먼저** 보이고 곧 실제 카드로 바뀐다.
 *    그래서 뱃지가 네모 14 에서 알약 11 로 튀었다(#847).
 *    다른 사용처(ProductBadge · CommunityDetail · SortableImageItem)는 className 으로
 *    덮어쓰므로 이 기본값이 안 보인다.
 */
export default function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold', className)}>
      {children}
    </span>
  )
}
