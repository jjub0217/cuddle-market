'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/commons/button/Button'
import { ROUTES } from '@/constants/routes'
import { useForm } from 'react-hook-form'
import InputField from '@/components/commons/InputField'
import { login } from '@/lib/api/auth'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'
import { useUserStore } from '@/store/userStore'
import axios from 'axios'
import { useEffect } from 'react'
import { TitleSection } from './TitleSection'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginForm() {
  const router = useRouter()
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<LoginFormValues>()
  const handleLogin = useUserStore((state) => state.handleLogin)
  const email = watch('email')
  const password = watch('password')

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await login(data)
      handleLogin(response.data.user, response.data.accessToken, response.data.refreshToken)
      const redirectUrl = useUserStore.getState().redirectUrl
      router.push(redirectUrl || '/')
      useUserStore.getState().setRedirectUrl(null)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          // 소셜로 가입한 사람이 이메일 로그인을 시도하면 여기로 떨어진다. 그런데 화면은
          // 「비밀번호가 틀렸나 보다」로 읽혀, 비밀번호 찾기까지 갔다가 거기서야 알게 된다.
          // 한 줄을 더해 그 앞에서 풀어 준다.
          //
          // ⚠️ **누구에게나 같은 문구**여야 한다. 「이 계정은 소셜입니다」처럼 갈라서 말하면
          //    남의 이메일을 넣어 가입 여부·가입 방법을 알아낼 수 있다(계정 열거).
          setError('root', {
            type: 'manual',
            message:
              '이메일 또는 비밀번호가 일치하지 않습니다. 소셜로 가입하셨다면 아래 소셜 로그인을 이용해주세요.',
          })
        } else {
          setError('root', {
            type: 'manual',
            message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          })
        }
      } else {
        setError('root', {
          type: 'manual',
          message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        })
      }
    }
  }

  useEffect(() => {
    if (errors.root) {
      clearErrors('root')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, clearErrors])

  return (
    <form className="flex w-full flex-col gap-10" onSubmit={handleSubmit(onSubmit)}>
      {/* 모바일에서는 숨김 (모바일 로그인 페이지는 상단에 별도 헤드라인 사용) */}
      <div className="hidden md:block">
        <TitleSection title="로그인" desc="계정에 로그인하여 더 많은 기능을 이용해보세요" size="sm" />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">로그인폼</legend>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* 이 두 칸은 **공용 Input 의 기본값을 그대로 쓴다** — 흰 배경 · border-outline(#D1D5DB).
                회원가입·비밀번호찾기·프로필수정과 같은 값이고, 앱 입력칸(colors.surface)과도 같다.

                전에는 이 화면만 배경이 bg-primary-50(크림)이었다. 로그인과 회원가입은
                「회원가입하기」로 바로 오가는 화면이라 나란히 보면 달라 보였다(#847).

                ⚠️ 테두리는 꼭 남긴다(border). 없으면 칸이 카드 배경과 밝기가 거의 같아
                   어디에 쓰는지 안 보인다 — 크림과 흰색은 색조만 다르다.
                   #D1D5DB 가 WCAG 1.4.11 의 3:1 에 못 미치는 것은 알고 고른 값이다.
                   까닭은 tokens.colors.css 의 --color-outline 에 적었다.

                글자만 **데스크탑에서 12** 다(md:text-xs). 폰은 공용 기본값 14 그대로다.
                이 화면은 칸이 둘뿐이라 안내글이 길고(「10~30자의 영문 대소문자, 숫자,
                특수문자 포함」) 넓은 화면에서 커 보인다 — 사용자가 실물을 보고 정했다.
                ⚠️ 다른 화면(회원가입·비밀번호찾기·프로필수정)은 14 다. 여기만 예외다. */}
            <InputField
              type="email"
              placeholder="이메일 (example@cuddle.com)"
              border
              size="text-sm md:text-xs"
              error={errors.email}
              registration={register('email', authValidationRules.email)}
            />
            <InputField
              type="password"
              placeholder="비밀번호 (10~30자의 영문 대소문자, 숫자, 특수문자 포함)"
              border
              size="text-sm md:text-xs"
              error={errors.password}
              registration={register('password', authValidationRules.password)}
            />
            {/* 글자 크기·굵기를 InputField 의 칸별 오류(text-xs font-semibold)와 똑같이 맞춘다.
                같은 화면에서 같은 일(오류 알림)을 하는데 서로 달라 보이던 것을 없앤 것이다. */}
            {errors.root ? <p className="text-danger-500 text-xs font-semibold">{errors.root.message}</p> : null}
          </div>
          {/* 밑줄 — 링크임을 색만으로 알리면 안 된다(WCAG 1.4.1 「색에 의존하지 않기」).
              underline-offset-2 는 글자 아래 획(ㅁ·ㅂ 등)에 선이 닿지 않게 띄운 값이다. */}
          {/* 둘은 **다른 것을 잊은 사람**을 위한 길이다. 비밀번호를 잊은 사람과
              「내가 카카오로 가입했던가?」를 잊은 사람은 서로 다른 곳으로 가야 한다.
              뒤엣것이 없어서 지금까지는 비밀번호 찾기가 그 노릇을 겸했고, 그러느라
              화면이 가입 여부를 말해야 했다 — 그게 #849 의 뿌리다.
              나란히 두고 가운데 막대로 가른다(앱 로그인 관문의 아래 링크와 같은 모양). */}
          <div className="flex items-center gap-2">
            <Link href={ROUTES.FIND_PASSWORD} className="text-primary text-xs font-medium underline underline-offset-2">
              비밀번호를 잊으셨나요?
            </Link>
            <span className="bg-outline h-3 w-px" aria-hidden="true" />
            <Link href={ROUTES.FIND_ACCOUNT} className="text-primary text-xs font-medium underline underline-offset-2">
              가입 방법을 잊으셨나요?
            </Link>
          </div>
        </div>
        {/* md 는 입력칸과 같은 40 이다(#847). 전에는 sm + py-3 md:py-2 로 높이를 손으로
            맞췄는데, 공용 조각이 h-* 로 정해지면서 그럴 필요가 없어졌다. */}
        <Button size="md" className="bg-primary-600 w-full cursor-pointer text-white" type="submit">
          로그인
        </Button>
      </fieldset>
    </form>
  )
}
