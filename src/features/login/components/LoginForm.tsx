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
          setError('root', {
            type: 'manual',
            message: '이메일 또는 비밀번호가 일치하지 않습니다.',
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
            {/* inputClass의 py-3은 모바일 폭에서만 효과가 있다 — Input의 기본값이 py-2/md:py-3이라
                데스크탑은 원래 py-3이었다. 공통 Input을 고치면 회원가입·비밀번호찾기까지 같이 커진다. */}
            <InputField
              type="email"
              placeholder="이메일 (example@cuddle.com)"
              backgroundColor="bg-primary-50"
              // ⚠️ 테두리가 없으면 입력칸이 배경과 **밝기가 같아**(1.0:1) 칸이 어디 있는지
              //    안 보인다 — 색조만 다르다. WCAG 1.4.11은 UI 요소 경계에 3:1을 요구한다.
              //    primary-500(#b06f15)이 팔레트에서 3:1을 넘는 가장 옅은 색이다(3.7:1).
              //    outline-variant(1.55)·outline-strong(2.07)은 둘 다 미달이다.
              border
              borderColor="border-primary-500"
              size="text-xs"
              inputClass="py-3"
              error={errors.email}
              registration={register('email', authValidationRules.email)}
            />
            <InputField
              type="password"
              placeholder="비밀번호 (10~30자의 영문 대소문자, 숫자, 특수문자 포함)"
              backgroundColor="bg-primary-50"
              // ⚠️ 테두리가 없으면 입력칸이 배경과 **밝기가 같아**(1.0:1) 칸이 어디 있는지
              //    안 보인다 — 색조만 다르다. WCAG 1.4.11은 UI 요소 경계에 3:1을 요구한다.
              //    primary-500(#b06f15)이 팔레트에서 3:1을 넘는 가장 옅은 색이다(3.7:1).
              //    outline-variant(1.55)·outline-strong(2.07)은 둘 다 미달이다.
              border
              borderColor="border-primary-500"
              size="text-xs"
              inputClass="py-3"
              error={errors.password}
              registration={register('password', authValidationRules.password)}
            />
            {errors.root ? <p className="text-danger-500 text-sm">{errors.root.message}</p> : null}
          </div>
          <Link href={ROUTES.FIND_PASSWORD} className="text-primary text-xs font-medium">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        {/* py-3 md:py-2 — 모바일 폭에서만 높이를 키운다. size="sm" 자체를 고치면 홈 필터·채팅 등 28개 파일이 같이 커진다. */}
        <Button size="sm" className="bg-primary-600 w-full cursor-pointer py-3 text-white md:py-2" type="submit">
          로그인
        </Button>
      </fieldset>
    </form>
  )
}
