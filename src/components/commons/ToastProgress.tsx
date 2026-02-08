'use client'

import { cn } from '@/lib/utils/cn'

interface ToastProgressProps {
  trackClass: string
  fillClass: string
  durationMs: number
  onEnd: () => void
}

export default function ToastProgress({ trackClass, fillClass, durationMs, onEnd }: ToastProgressProps) {
  return (
    <div className={cn('relative h-1 w-full overflow-hidden', trackClass)}>
      <div className={cn('toast-progress__fill', `[--toast-duration:${durationMs}ms]`, fillClass)} onAnimationEnd={onEnd} />
    </div>
  )
}
