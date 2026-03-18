import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { TitleSection } from './components/TitleSection'
import { SocialLoginButtons } from './components/SocialLoginButtons'
import { LoginForm } from './components/LoginForm'

function Login() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#F3F4F6]">
      <div className="flex h-full min-w-full flex-col items-center gap-10 bg-white px-8 py-10 md:h-auto md:min-w-100 md:rounded-[20px]">
        <TitleSection title="로그인" />
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
  )
}

export default Login
