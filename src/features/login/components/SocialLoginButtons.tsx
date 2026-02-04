'use client'

import { Button } from '@/components/commons/button/Button'

export function SocialLoginButtons() {
  const handleGoogleLogin = () => {
    window.location.href = 'https://cmarket-api.duckdns.org/oauth2/authorization/google'
  }
  const handleKakaoLogin = () => {
    window.location.href = 'https://cmarket-api.duckdns.org/oauth2/authorization/kakao'
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button iconSrc="/images/kakao.svg" size="md" className="w-full cursor-pointer bg-[#fee500]" onClick={handleKakaoLogin}>
        카카오 간편 로그인
      </Button>
      <Button iconSrc="/images/google.svg" size="md" className="w-full cursor-pointer bg-[#F2F2F2]" onClick={handleGoogleLogin}>
        구글 간편 로그인
      </Button>
    </div>
  )
}
