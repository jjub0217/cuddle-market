'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { TOAST_ICONS, TOAST_COLORS, TOAST_CLOSE_BTN, TOAST_ANIMATION } from '@/constants/constants'
import type { ToastType } from '@/types/toast'
import ToastProgress from './ToastProgress'
import { cn } from '@/lib/utils/cn'

interface ToastCardProps {
  type: ToastType
  title?: string
  children?: ReactNode
  durationMs: number
  pauseOnHover: boolean
  showBar: boolean
  onClose: () => void
}

export default function ToastCard({ type, title, children, durationMs, showBar, onClose }: ToastCardProps) {
  const LeadingIcon = TOAST_ICONS[type]

  return (
    <motion.div
      layout="position"
      variants={TOAST_ANIMATION}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pointer-events-auto flex w-full flex-col"
    >
      <div className={cn('relative overflow-hidden rounded-xl border', TOAST_COLORS[type].box)}>
        <div className="flex w-full items-start gap-3 px-4 py-3">
          <div className="mt-0.5">
            <LeadingIcon className={cn('h-5 w-5', TOAST_COLORS[type].icon)} />
          </div>

          <div className="min-w-0 flex-1">
            {title && <h4 className={cn('truncate text-[15px] font-semibold', TOAST_COLORS[type].text)}>{title}</h4>}
            {children && <div className={cn('mt-0.5 text-sm leading-5 wrap-break-word', TOAST_COLORS[type].text)}>{children}</div>}
          </div>

          <button
            type="button"
            aria-label="close toast"
            onClick={onClose}
            className={cn('ml-1 shrink-0 cursor-pointer rounded p-1 transition-colors', 'focus:outline-none focus-visible:ring-2', TOAST_CLOSE_BTN[type])}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showBar && <ToastProgress trackClass={TOAST_COLORS[type].bar} fillClass={TOAST_COLORS[type].text} durationMs={durationMs} onEnd={onClose} />}
      </div>
    </motion.div>
  )
}
