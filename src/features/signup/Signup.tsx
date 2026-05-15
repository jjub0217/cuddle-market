import { TitleSection } from '../login/components/TitleSection'
import { ROUTES } from '@/constants/routes'
import { SignUpForm } from './components/SignUpForm'
import Logo from '@/components/Logo'

export default function Signup() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-baseline bg-[#F3F4F6] py-20 md:justify-center">
      <div className="flex min-w-full flex-col items-center gap-2 md:min-w-132.5">
        <Logo />
        <div className="flex flex-col items-center gap-9">
          <TitleSection
            title="커들마켓에 오신것을 환영합니다!"
            desc="반려동물과 이웃을 잇는 따뜻한 커뮤니티"
            // link="로그인하기"
            // linkPath={ROUTES.LOGIN}
          />
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}
