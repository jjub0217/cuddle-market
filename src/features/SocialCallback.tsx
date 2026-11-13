'use client'

import { needsSocialSignup } from '@cuddle/shared'
import { api } from '@/lib/api/api'
import { useUserStore } from '@/store/userStore'
import { useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SocialCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleLogin, setAccessToken, setRefreshToken } = useUserStore()
  // 주소에서 토큰을 지우면 searchParams 가 바뀌어 effect 가 다시 돈다. 처음 한 번만 처리한다.
  const handledRef = useRef(false)

  const handleSocialAuth = useCallback(
    async (accessToken: string, refreshToken: string) => {
      try {
        useUserStore.getState().clearAll()
        setAccessToken(accessToken)
        setRefreshToken(refreshToken)

        const userResponse = await api.get('/profile/me')
        const user = userResponse.data.data

        if (needsSocialSignup(user)) {
          sessionStorage.setItem('socialSignupUser', JSON.stringify(user))
          router.replace('/auth/social-signup')
          return
        } else {
          handleLogin(user, accessToken, refreshToken)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        const redirectUrl = useUserStore.getState().redirectUrl
        router.replace(redirectUrl || '/')
        useUserStore.getState().setRedirectUrl(null)
      } catch {
        router.replace('/auth/login')
      }
    },
    [setAccessToken, setRefreshToken, handleLogin, router]
  )

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')

    // 토큰이 담긴 주소가 방문 기록에 남지 않게, 읽자마자 주소에서 쿼리를 지운다
    window.history.replaceState(null, '', window.location.pathname)

    if (accessToken && refreshToken) {
      handleSocialAuth(accessToken, refreshToken)
    } else {
      router.replace('/auth/login')
    }
  }, [handleSocialAuth, router, searchParams])

  return (
    <div className="text-center mt-25">
      <h2>로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  )
}
