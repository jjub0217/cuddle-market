import { TitleSection } from '../login/components/TitleSection'
import { ROUTES } from '@/constants/routes'
import { SignUpForm } from './components/SignUpForm'
import Logo from '@/components/Logo'

// 모바일 폭에도 배경 무늬(login-bg.png)를 두지 않는다.
// 로그인은 칸이 둘뿐이라 무늬가 빈 자리에만 보이지만, 회원가입은 칸이 아홉이라
// 입력칸과 검증 문구 뒤에 깔린다. 특히 빨강·초록 작은 글씨 위에 겹쳐 읽기 나쁘다.
// (로그인 화면은 그대로 둔다 — Login.tsx)
export default function Signup() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-baseline bg-white py-20 md:justify-center md:bg-[#F3F4F6]">
      <div className="flex min-w-full flex-col items-center gap-2 md:min-w-132.5">
        <Logo />
        <div className="flex flex-col items-center gap-9">
          <div className="hidden md:block">
            <TitleSection
              title="커들마켓에 오신것을 환영합니다!"
              desc="반려동물과 이웃을 잇는 따뜻한 커뮤니티"
              // link="로그인하기"
              // linkPath={ROUTES.LOGIN}
            />
          </div>
          <h1 className="heading-h3 text-center md:hidden">
            커들마켓에 오신것을
            <br />
            환영합니다!
          </h1>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}
