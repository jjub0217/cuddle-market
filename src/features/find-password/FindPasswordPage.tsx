import { FindPasswordForm } from './components/FindPasswordForm'
import { TitleSection } from '../login/components/TitleSection'

export default function FindPasswordPage() {
  return (
    <div className="flex h-[calc(100dvh-100px)] flex-col items-center justify-center bg-[#F3F4F6]">
      <div className="flex w-full max-w-112.5 flex-col items-center gap-10 px-5 md:px-0">
        <TitleSection title="비밀번호 찾기" desc="가입한 이메일로 비밀번호를 재설정할 수 있습니다" />
        <FindPasswordForm />
      </div>
    </div>
  )
}
