import { FindAccountForm } from './components/FindAccountForm'
import { TitleSection } from '../login/components/TitleSection'

// 계정 찾기. **「가입 방법」을 알려주는 화면**이다.
//
// 이 서비스는 이메일이 곧 아이디라 전통적인 「아이디 찾기」가 필요 없다. 사용자가
// 모르는 것은 **어떻게 가입했는가**(이메일·카카오·구글)다(#849).
//
// 겉모양은 비밀번호 찾기(FindPasswordPage)와 같은 틀을 쓴다. 두 화면을 오가는
// 사람이 많아서 달라 보이면 안 된다.

export default function FindAccountPage() {
  return (
    <div className="flex h-[calc(100dvh-100px)] flex-col items-center justify-center bg-[#F3F4F6]">
      <div className="flex w-full max-w-112.5 flex-col items-center gap-10 px-5 md:px-0">
        <TitleSection title="계정 찾기" desc="가입 방법을 잊으셨다면 이메일로 알려드립니다" />
        <FindAccountForm />
      </div>
    </div>
  )
}
