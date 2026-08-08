'use client'

import Button from '@/components/commons/button/Button'

const OAUTH_BASE_URL = 'https://cmarket-api.duckdns.org'

export function SocialLoginButtons() {
  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/* h-10 — 로그인 단추(md, 40)와 같은 높이다. size 는 sm 을 둔다: 아래 구글 버튼이
          여백·글자를 브랜딩 규격에 맞춰야 해서, 셋을 같은 size 로 두고 높이만 맞춘다(#847). */}
      {/* border-transparent — 아래 구글 버튼이 테두리를 갖는다. 안 주면 이 버튼만 2px 낮아진다. */}
      <Button
        iconSrc="/images/kakao.svg"
        size="sm"
        className="h-10 w-full cursor-pointer border border-transparent bg-[#fee500]"
        onClick={() => handleSocialLogin('kakao')}
      >
        카카오 간편 로그인
      </Button>
      {/* 구글 브랜딩 가이드의 「라이트」 테마다 — 배경 #FFFFFF + 테두리 #747775 1px(안쪽).
          https://developers.google.com/identity/branding-guidelines?hl=ko

          예전에는 「중립」 테마(배경 #F2F2F2, 테두리 없음)였다. 가이드가 중립에 테두리를 안 주는 건
          버튼과 대비되는 배경을 전제해서인데, 우리 로그인 배경이 #F3F4F6 이라 버튼과 1.02:1 로
          거의 같은 회색이었다 — 버튼이 배경에 묻혀 보이지 않았다. 라이트 테마의 테두리는 회색
          배경에서 4.11:1, 흰 카드에서 4.32:1 이다.
          ⚠️ 중립 테마에 테두리만 붙이는 조합은 가이드에 없다. 테마를 통째로 바꿔야 한다.

          문구는 가이드가 정한 셋 중 하나여야 한다 — 「Google 계정으로 로그인」·「~으로 가입」·
          「~으로 계속」. 예전의 「구글 간편 로그인」은 목록 밖이었다.

          여백·글자 크기는 size="sm" 이 이미 규격과 같다(좌우 12px · 로고와 글자 사이 10px ·
          14/20 · Medium). 글자색만 가이드 값(#1F1F1F)으로 맞춘다.
          글꼴은 가이드가 Roboto Medium 을 권하지만 Pretendard 를 그대로 둔다 — 문구가 한글이라
          Roboto 에 글리프가 없어 어차피 대체 글꼴로 떨어지고, 「Google」 한 단어 때문에 웹폰트를
          더 받으면 한 줄 안에서 글꼴이 갈린다. */}
      <Button
        iconSrc="/images/google.svg"
        size="sm"
        className="h-10 w-full cursor-pointer border border-[#747775] bg-white text-[#1F1F1F]"
        onClick={() => handleSocialLogin('google')}
      >
        Google 계정으로 로그인
      </Button>
    </div>
  )
}
