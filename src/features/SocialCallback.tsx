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
      useUserStore.getState().clearAll()
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)

      const userResponse = await api.get('/profile/me')
      const user = userResponse.data.data

      if (!user.addressSido || !user.birthDate) {
        sessionStorage.setItem('socialSignupUser', JSON.stringify(user))
        router.push('/auth/social-signup')
        return
      } else {
        handleLogin(user, accessToken, refreshToken)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const redirectUrl = useUserStore.getState().redirectUrl
      router.push(redirectUrl || '/')
      useUserStore.getState().setRedirectUrl(null)
    },
    [setAccessToken, setRefreshToken, handleLogin, router]
  )

  useEffect(() => {
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
