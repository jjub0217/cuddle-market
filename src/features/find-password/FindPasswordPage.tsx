import { FindPasswordForm } from './components/FindPasswordForm'
import { TitleSection } from '../login/components/TitleSection'
// import { TitleSection } from './components/TitleSection'
// import { SocialLoginButtons } from './components/SocialLoginButtons'
// import { LoginForm } from './components/LoginForm'

export default function FindPasswordPage() {
  return (
    <div className="flex h-[calc(100dvh-100px)] flex-col items-center justify-center bg-[#F3F4F6]">
      <div className="flex min-w-[450px] flex-col items-center gap-10">
        <TitleSection title="비밀번호 찾기" desc="가입한 이메일로 비밀번호를 재설정할 수 있습니다" />
        <FindPasswordForm />
      </div>
    </div>
  )
}
