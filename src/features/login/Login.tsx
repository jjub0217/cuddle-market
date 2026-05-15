import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { TitleSection } from './components/TitleSection'
import { SocialLoginButtons } from './components/SocialLoginButtons'
import { LoginForm } from './components/LoginForm'
import Logo from '@/components/Logo'

function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#F3F4F6] py-20">
      <div className="flex min-w-full flex-col items-center gap-2 md:min-w-132.5">
        <Logo />
        <div className="flex flex-col items-center gap-9">
          <TitleSection title="우리 아이를 위한 믿음직한 선택" desc="로그인하고 반려동물 이웃과의 특별한 일상을 시작해보세요" />
          <div className="bg-surface border-outline-variant/10 flex h-full min-w-full flex-col items-center gap-9 border px-10 py-7 shadow-2xl md:h-auto md:min-w-100 md:rounded-3xl">
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
                <Link href={ROUTES.SIGNUP} className="text-primary-300 text-sm font-bold">
                  회원가입하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
