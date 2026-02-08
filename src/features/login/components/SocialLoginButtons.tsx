'use client'

import Button from '@/components/commons/button/Button'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export function SocialLoginButtons() {
  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button iconSrc="/images/kakao.svg" size="md" className="w-full cursor-pointer bg-[#fee500]" onClick={() => handleSocialLogin('kakao')}>
        카카오 간편 로그인
      </Button>
      <Button iconSrc="/images/google.svg" size="md" className="w-full cursor-pointer bg-[#F2F2F2]" onClick={() => handleSocialLogin('google')}>
        구글 간편 로그인
      </Button>
    </div>
  )
}
