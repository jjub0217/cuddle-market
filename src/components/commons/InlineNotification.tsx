import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TOAST_ICONS } from '@/constants/constants'
import ToastProgress from './ToastProgress'
import type { ToastType } from '@/types/toast'

const NOTIFICATION_STYLES: Record<ToastType, { box: string; icon: string; text: string; bar: string; iconWrapper: string }> = {
  success: {
    box: 'border-[#71ca77] bg-[#ddfae3] text-[#62b66a]',
    icon: 'stroke-white stroke-5',
    text: 'text-success-600 ',
    bar: 'bg-success-200',
    iconWrapper: 'bg-success-500 rounded-full p-1.5 mt-1',
  },
  error: {
    box: 'border-[#db202a] bg-[#fff1f1] text-[#be5e5a]',
    icon: 'stroke-white stroke-5 rotate-90',
    text: 'text-danger-500 ',
    bar: 'bg-danger-200',
    iconWrapper: 'bg-danger-500 rounded-full p-1.5 mt-1',
  },
  warning: {
    box: 'border-[#d0ad39] bg-[#faf7be] text-[#d2ad36]',
    icon: 'stroke-[#d0ad39] stroke-3 h-4 w-4',
    text: 'text-[#d9ac2c] ',
    bar: 'bg-[#faf7be]',
    iconWrapper: 'bg-[#faf7be] rounded-full p-1.5',
  },
}

interface InlineNotificationProps {
  type: ToastType
  children: React.ReactNode
  onClose: () => void
  durationMs?: number
}

export default function InlineNotification({ type, children, onClose, durationMs = 5000 }: InlineNotificationProps) {
  const Icon = TOAST_ICONS[type]
  const styles = NOTIFICATION_STYLES[type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={cn('overflow-hidden rounded-lg border pt-2 text-sm', styles.box)}
    >
      <div className="flex items-start gap-2 px-2 pb-2">
        <div className={styles.iconWrapper}>
          <Icon className={cn('h-2 w-2 shrink-0', styles.icon)} />
        </div>
        <div className="text-sm">{children}</div>
        <button
          type="button"
          aria-label="close notification"
          onClick={onClose}
          className={cn('ml-auto shrink-0 cursor-pointer rounded p-1 transition-colors focus:outline-none focus-visible:ring-2', styles.text)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ToastProgress trackClass={styles.bar} fillClass={styles.text} durationMs={durationMs} onEnd={onClose} />
    </motion.div>
  )
}
