import { useToastStore } from '@/store/toastStore'

export function useToast() {
  const success = useToastStore((state) => state.success)
  const error = useToastStore((state) => state.error)
  const warning = useToastStore((state) => state.warning)

  return { success, error, warning }
}
