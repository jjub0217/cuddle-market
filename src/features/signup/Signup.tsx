import { TitleSection } from '../login/components/TitleSection'
import { ROUTES } from '@/constants/routes'
import { SignUpForm } from './components/SignUpForm'
import Logo from '@/components/Logo'

// 배경 무늬(login-bg.png) 대신 단색을 쓴다. 무늬가 입력칸·검증 문구 뒤에 깔려
// 읽기 나빴다.
//
// 로그인도 2026-08-04에 같은 단색으로 바꿨다 — 예전에는 「칸이 둘뿐이라 빈 자리에만
// 보인다」고 그대로 뒀는데, 로그인 화면을 폭에 상관없이 하나로 통일하기로 했다.
//
// ⚠️ 배경색을 넣을 때 폼을 흰 카드에 올려야 한다. 검증 문구 색(--color-success-500
// #15803D)이 흰 배경에서도 5.02:1로 간당간당해서, 배경을 조금만 어둡게 해도 AA
// 기준 4.5:1이 무너진다. #F4D6AA 위에서는 3.59:1이다. 데스크탑이 이미 회색 배경 +
// 흰 카드 구조라, 모바일도 같은 구조로 맞춘다.
export default function Signup() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-baseline bg-[#F4D6AA] px-4 py-20 md:justify-center md:bg-[#F3F4F6] md:px-0">
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
