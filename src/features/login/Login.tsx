import { ROUTES } from '@/constants/routes'
import { TitleSection } from './components/TitleSection'
import { SocialLoginButtons } from './components/SocialLoginButtons'
import { LoginForm } from './components/LoginForm'

function Login() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#F3F4F6]">
      <div className="flex h-full min-w-full flex-col items-center gap-10 bg-white px-5 py-10 md:h-auto md:min-w-[400px] md:rounded-[20px]">
        <TitleSection title="로그인" desc="아직 계정이 없으신가요?" link="회원가입하기" linkPath={ROUTES.SIGNUP} />
        <SocialLoginButtons />
        <LoginForm />
      </div>
    </div>
  )
}

export default Login
