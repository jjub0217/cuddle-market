import { useToastStore } from '@/store/toastStore'

/**
 * 토스트 알림을 사용하기 위한 훅
 *
 * Zustand 스토어 기반으로 Provider 없이 어디서든 사용 가능합니다.
 *
 * @example
 * const toast = useToast()
 * toast.success({ title: '성공', content: '저장되었습니다.' })
 * toast.error({ title: '실패', content: '오류가 발생했습니다.' })
 * toast.warning({ title: '경고', content: '주의하세요.' })
 */
export function useToast() {
  const success = useToastStore((state) => state.success)
  const error = useToastStore((state) => state.error)
  const warning = useToastStore((state) => state.warning)

  return { success, error, warning }
}
