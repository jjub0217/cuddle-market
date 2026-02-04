'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'

/**
 * 앱 시작 시 인증 상태를 검증하는 컴포넌트
 * 토큰과 유저 상태의 동기화를 담당
 */
export default function AuthValidator() {
  const validateAuthState = useUserStore((state) => state.validateAuthState)

  useEffect(() => {
    validateAuthState()
  }, [validateAuthState])

  return null
}
