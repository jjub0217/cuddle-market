'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/api/auth'
import { AUTH_REQUIRED_ROUTES, ROUTES } from '@/constants/routes'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { chatSocketStore } from '@/store/chatSocketStore'

export function useLogout(onBeforeCleanup?: () => void) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const { clearAll } = useUserStore()
  const { openLogoutModal } = useLoginModalStore()
  const { disconnect } = chatSocketStore()

  const isAuthRequiredPage = AUTH_REQUIRED_ROUTES.some((path) => pathname.startsWith(path))

  const executeLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('로그아웃 API 실패:', error)
    } finally {
      onBeforeCleanup?.()
      disconnect()
      clearAll()
      queryClient.clear()
      if (isAuthRequiredPage) {
        router.push(ROUTES.HOME)
      }
    }
  }

  const openLogoutConfirm = () => {
    openLogoutModal(executeLogout)
  }

  return { executeLogout, openLogoutConfirm }
}
