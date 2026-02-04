import { cn } from '@/lib/utils/cn'

interface ToastProgressProps {
  trackClass: string
  fillClass: string
  durationMs: number
  onEnd: () => void
}

/**
 * 토스트 진행바 컴포넌트
 * CSS 애니메이션으로 시간 경과를 시각적으로 표시하며,
 * 애니메이션 종료 시 onEnd 콜백을 호출합니다.
 */
export default function ToastProgress({ trackClass, fillClass, durationMs, onEnd }: ToastProgressProps) {
  return (
    <div className={cn('relative h-1 w-full overflow-hidden', trackClass)}>
      <div className={cn('toast-progress__fill', `[--toast-duration:${durationMs}ms]`, fillClass)} onAnimationEnd={onEnd} />
    </div>
  )
}
