export type ToastType = 'success' | 'error' | 'warning'

export interface ToastOptions {
  type?: ToastType
  title?: string
  content?: string
  durationMs?: number
  pauseOnHover?: boolean
  showBar?: boolean
}

/** 스토어에서 관리하는 토스트 아이템 (내부용) */
export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  content?: string
  durationMs: number
  pauseOnHover: boolean
  showBar: boolean
}
