'use client'

import Button from '@/components/commons/button/Button'

const OAUTH_BASE_URL = 'https://cmarket-api.duckdns.org'

export function SocialLoginButtons() {
  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`
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
