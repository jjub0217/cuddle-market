import { AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/store/toastStore'
import ToastCard from './ToastCard'
import { Z_INDEX } from '@/constants/ui'

/**
 * 토스트 알림 컨테이너 컴포넌트
 *
 * App.tsx 최상단에 한 번만 배치하면 됩니다.
 */
export default function ToastContainer() {
  const visible = useToastStore((state) => state.visible)
  const remove = useToastStore((state) => state.remove)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none fixed top-4 right-4 flex w-[min(92vw,380px)] flex-col gap-2 ${Z_INDEX.TOAST}`}
    >
      <AnimatePresence mode="popLayout">
        {visible.map((toast) => (
          <ToastCard
            key={toast.id}
            type={toast.type}
            title={toast.title}
            durationMs={toast.durationMs}
            pauseOnHover={toast.pauseOnHover}
            showBar={toast.showBar}
            onClose={() => remove(toast.id)}
          >
            {toast.content}
          </ToastCard>
        ))}
      </AnimatePresence>
    </div>
  )
}
