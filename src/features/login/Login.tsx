'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { TitleSection } from './components/TitleSection'
import { SocialLoginButtons } from './components/SocialLoginButtons'
import { LoginForm } from './components/LoginForm'
import Logo from '@/components/Logo'

function Login() {
  return (
    <>
      {/* 모바일: Header는 Header.tsx에서 렌더 스킵됨(DOM 제거) → 일반 흐름. 데스크탑: 기존 디자인 100% 보존 */}
      {/* 배경은 폭에 상관없이 같은 회색이다. 모바일에만 깔던 배경 사진(login-bg.png)은
          로그인 화면을 하나로 통일하기로 해서 뺐다(2026-08-04). */}
      <div className="flex min-h-screen flex-col items-center justify-start bg-[#F3F4F6] py-20">
        <div className="flex min-w-full flex-col items-center gap-2 md:min-w-132.5">
          {/* 모바일 폭에서만 로고를 키운다(h-9 → h-11). 데스크탑(md 이상)은 기존 h-10 그대로. */}
          <Logo logoClassname="h-11 md:h-10" />
          <div className="flex w-full flex-col items-center gap-9 md:w-auto">
            {/* 데스크탑: 기존 타이틀 + 설명 그대로 */}
            <div className="hidden md:block">
              <TitleSection
                title="우리 아이를 위한 믿음직한 선택"
                desc="로그인하고 반려동물 이웃과의 특별한 일상을 시작해보세요"
              />
            </div>
            <div className="md:bg-surface md:border-outline-variant/10 flex h-full min-w-full flex-col items-center gap-9 px-10 py-7 md:h-auto md:min-w-100 md:rounded-3xl md:border md:shadow-2xl">
              <LoginForm />
              <div className="flex w-full flex-col gap-3">
                <div className="flex w-full items-center gap-4">
                  <div role="separator" className="h-px flex-1 bg-black/10" />
                  <span className="text-xs text-gray-500">소셜 계정으로 로그인</span>
                  <div role="separator" className="h-px flex-1 bg-black/10" />
                </div>
                <SocialLoginButtons />
                <div className="mt-3 flex w-full justify-center gap-1">
                  <span className="text-sm">아직 계정이 없으신가요?</span>
                  <Link href={ROUTES.SIGNUP} className="text-primary text-sm font-bold">
                    회원가입하기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 모바일(md 미만): 번개장터식 풀스크린 리뉴얼 ===== */}
      {/* (main) 공통 헤더/하단바를 덮는 풀스크린 오버레이. 폭 붕괴 방지 위해 모든 래퍼에 w-full 명시 */}
      {/* <div className={cn('fixed inset-0 w-full overflow-y-auto md:hidden', Z_INDEX.MODAL)}>
        <div className="flex min-h-full w-full flex-col">
          <header className="flex w-full flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <h1 className="text-3xl leading-snug font-extrabold text-white drop-shadow-lg">
              우리 아이를 위한
              <br />
              믿음직한 선택
            </h1>
            <p className="mt-4 text-sm text-white/85 drop-shadow">로그인하고 반려동물 이웃과의 특별한 일상을 시작해보세요</p>
          </header>

          <div className="mx-auto w-full max-w-md rounded-t-[1.75rem] bg-white px-6 pt-7 pb-10 shadow-2xl">
            <div className="mb-6 flex w-full justify-center">
              <Logo logoClassname="h-8" />
            </div>

            <LoginForm />

            <div className="mt-7 flex w-full flex-col gap-4">
              <div className="flex w-full items-center gap-4">
                <div role="separator" className="h-px flex-1 bg-black/10" />
                <span className="shrink-0 text-xs text-gray-500">소셜 계정으로 로그인</span>
                <div role="separator" className="h-px flex-1 bg-black/10" />
              </div>

              <SocialLoginButtons />

              <div className="flex w-full justify-center gap-1 pt-1">
                <span className="text-sm text-gray-600">아직 계정이 없으신가요?</span>
                <Link href={ROUTES.SIGNUP} className="text-primary-500 text-sm font-bold">
                  회원가입하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </>
  )
}

export default Login
