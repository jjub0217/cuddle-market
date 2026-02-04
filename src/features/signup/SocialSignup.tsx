import { TitleSection } from '../login/components/TitleSection'
import { SocialSignUpForm } from './components/SocialSignUpForm'

export default function SocialSignup() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-baseline bg-white py-10 md:justify-center md:bg-[#F3F4F6]">
      <div className="flex min-w-full flex-col items-center gap-9 rounded-[20px] bg-white px-5 md:min-w-[530px] md:py-10">
        <TitleSection title="추가 정보 입력" desc="서비스 이용을 위해 아래 정보가 필요합니다" />
        <SocialSignUpForm />
      </div>
    </div>
  )
}
