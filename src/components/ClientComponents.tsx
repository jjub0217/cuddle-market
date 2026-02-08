'use client'

import dynamic from 'next/dynamic'

// SSR 비활성화로 클라이언트에서만 렌더링
const AuthValidator = dynamic(() => import('@/components/AuthValidator'), { ssr: false })
// TODO: LoginModal 마이그레이션 후 추가 (#39-#41)
// const LoginModal = dynamic(() => import('@/components/modal/LoginModal'), { ssr: false })
const ToastContainer = dynamic(() => import('@/components/commons/ToastContainer'), { ssr: false })

/**
 * 클라이언트에서만 렌더링되는 전역 컴포넌트들
 * - AuthValidator: 앱 시작 시 인증 상태 검증
 * - LoginModal: 전역 로그인 모달 (TODO)
 * - ToastContainer: 전역 토스트 알림
 */
export default function ClientComponents() {
  return (
    <>
      <AuthValidator />
      <ToastContainer />
    </>
  )
}
