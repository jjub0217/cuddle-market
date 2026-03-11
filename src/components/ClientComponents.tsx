'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { useToastStore } from '@/store/toastStore'

// SSR 비활성화로 클라이언트에서만 렌더링
const AuthValidator = dynamic(() => import('@/components/AuthValidator'), { ssr: false })
const LoginModal = dynamic(() => import('@/components/modal/LoginModal'), { ssr: false })
const ToastContainer = dynamic(() => import('@/components/commons/ToastContainer'), { ssr: false })

/**
 * 클라이언트에서만 렌더링되는 전역 컴포넌트들
 * - StoreHydration: Zustand persist 스토어를 클라이언트에서 rehydrate
 * - AuthValidator: 앱 시작 시 인증 상태 검증
 * - LoginModal: 전역 로그인/로그아웃 모달 (열릴 때만 로드)
 * - ToastContainer: 전역 토스트 알림 (토스트가 있을 때만 로드)
 */
export default function ClientComponents() {
  const isLoginModalOpen = useLoginModalStore((state) => state.isOpen)
  const hasToasts = useToastStore((state) => state.visible.length > 0 || state.queue.length > 0)

  useEffect(() => {
    useUserStore.persist.rehydrate()
  }, [])

  return (
    <>
      <AuthValidator />
      {isLoginModalOpen ? <LoginModal /> : null}
      {hasToasts ? <ToastContainer /> : null}
    </>
  )
}
