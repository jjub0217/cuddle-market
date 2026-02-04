import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useUserStore } from '@/store/userStore'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
// SSE 실시간 연결
export function useNotificationSSE() {
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const accessToken = useUserStore((state) => state.accessToken)
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null)

  useEffect(() => {
    if (!user || !accessToken) {
      return
    }

    // 이전 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/notifications/stream`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'text/event-stream',
      },
    })
    eventSourceRef.current = eventSource

    // notification 이벤트: 새 알림이 왔을 때
    eventSource.addEventListener('notification', () => {
      try {
        queryClient.setQueryData<{ unreadCount: number }>(['notifications', 'unreadCount'], (prev) => ({
          unreadCount: (prev?.unreadCount ?? 0) + 1,
        }))
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      } catch (err) {
        console.error('[SSE] notification payload 파싱 오류:', err)
      }
    })

    return () => {
      eventSource.close()
    }
  }, [user, accessToken, queryClient])
}
