'use client'

import Button from '@/components/commons/button/Button'

const OAUTH_BASE_URL = 'https://cmarket-api.duckdns.org'

export function SocialLoginButtons() {
  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/* py-3 md:py-2 — 모바일 폭에서만 높이를 키운다. 로그인 버튼과 같은 값이라 셋의 높이가 맞는다. */}
      <Button
        iconSrc="/images/kakao.svg"
        size="sm"
        className="w-full cursor-pointer bg-[#fee500] py-3 md:py-2"
        onClick={() => handleSocialLogin('kakao')}
      >
        카카오 간편 로그인
      </Button>
      <Button
        iconSrc="/images/google.svg"
        size="sm"
        className="w-full cursor-pointer bg-[#F2F2F2] py-3 md:py-2"
        onClick={() => handleSocialLogin('google')}
      >
        구글 간편 로그인
      </Button>
    </div>
  )
}
