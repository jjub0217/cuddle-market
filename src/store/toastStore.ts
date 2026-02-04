import { create } from 'zustand'
import { TOAST_DEFAULTS, TOAST_DURATION_BY_TYPE } from '@/constants/constants'
import type { ToastItem, ToastOptions, ToastType } from '@/types/toast'

/** 고유 토스트 ID 생성 */
const makeToastId = () => crypto.randomUUID()

interface ToastState {
  visible: ToastItem[]
  queue: ToastItem[]
}

interface ToastActions {
  show: (opts?: ToastOptions) => void
  remove: (id: string) => void
  success: (opts?: Omit<ToastOptions, 'type'>) => void
  error: (opts?: Omit<ToastOptions, 'type'>) => void
  warning: (opts?: Omit<ToastOptions, 'type'>) => void
}

type ToastStore = ToastState & ToastActions

export const useToastStore = create<ToastStore>((set, get) => ({
  visible: [],
  queue: [],

  show: (opts = {}) => {
    const type: ToastType = opts.type ?? 'success'
    const durationMs = opts.durationMs ?? TOAST_DURATION_BY_TYPE[type] ?? TOAST_DEFAULTS.durationMs

    const item: ToastItem = {
      id: makeToastId(),
      type,
      title: opts.title,
      content: opts.content,
      durationMs,
      pauseOnHover: opts.pauseOnHover ?? true,
      showBar: opts.showBar ?? true,
    }

    set((state) => {
      if (state.visible.length < TOAST_DEFAULTS.maxVisible) {
        return { visible: [item, ...state.visible] }
      }
      return { queue: [...state.queue, item] }
    })
  },

  remove: (id: string) => {
    set((state) => {
      const nextVisible = state.visible.filter((toast) => toast.id !== id)

      if (nextVisible.length !== state.visible.length && state.queue.length > 0) {
        const [next, ...rest] = state.queue
        return { visible: [next, ...nextVisible], queue: rest }
      }
      return { visible: nextVisible }
    })
  },

  success: (opts) => get().show({ ...opts, type: 'success' }),
  error: (opts) => get().show({ ...opts, type: 'error' }),
  warning: (opts) => get().show({ ...opts, type: 'warning' }),
}))
