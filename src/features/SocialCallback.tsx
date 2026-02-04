'use client'

import { api } from '@/lib/api/api'
import { useUserStore } from '@/store/userStore'
import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SocialCallback() {
  const router = useRouter()
  const { handleLogin, setAccessToken, setRefreshToken } = useUserStore()

  const handleSocialAuth = useCallback(
    async (accessToken: string, refreshToken: string) => {
      // 1. 기존 상태 클리어 후 새 토큰 저장 (회원탈퇴 후 재로그인 시 옛날 토큰 문제 방지)
      useUserStore.getState().clearAll()
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)

      // 2. 토큰으로 user 정보 조회 API 호출
      // 유저 정보 확인 → nickname, addressSido가 없으면 프로필 완성 페이지로 리다이렉트
      const userResponse = await api.get('/profile/me')
      const user = userResponse.data.data

      if (!user.addressSido || !user.birthDate) {
        // 신규 회원: 프로필 완성 페이지로 이동 (handleLogin 호출 안 함 → 헤더 비로그인 상태)
        // Next.js doesn't support state in router.push, using sessionStorage
        sessionStorage.setItem('socialSignupUser', JSON.stringify(user))
        router.push('/auth/social-signup')
        return
      } else {
        // 기존 회원: 로그인 처리 후 홈으로 이동
        handleLogin(user, accessToken, refreshToken)
        // localStorage에 persist가 완료될 때까지 대기
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // 4. 저장된 redirectUrl이 있으면 해당 페이지로, 없으면 홈으로 이동
      const redirectUrl = useUserStore.getState().redirectUrl
      router.push(redirectUrl || '/')
      useUserStore.getState().setRedirectUrl(null)
    },
    [setAccessToken, setRefreshToken, handleLogin, router]
  )

  useEffect(() => {
    // URL에서 토큰 추출
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (accessToken && refreshToken) {
      handleSocialAuth(accessToken, refreshToken)
    } else {
      router.push('/login')
    }
  }, [handleSocialAuth, router])

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  )
}
