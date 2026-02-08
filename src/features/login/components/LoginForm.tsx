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
        }
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
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">로그인폼</legend>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <InputField
              type="email"
              placeholder="이메일 (example@cuddle.com)"
              backgroundColor="bg-primary-50"
              size="text-sm"
              error={errors.email}
              registration={register('email', authValidationRules.email)}
            />
            <InputField
              type="password"
              placeholder="비밀번호 (10~30자의 영문 대소문자, 숫자, 특수문자 포함)"
              backgroundColor="bg-primary-50"
              size="text-sm"
              error={errors.password}
              registration={register('password', authValidationRules.password)}
            />
            {errors.root && <p className="text-danger-500 text-sm">{errors.root.message}</p>}
          </div>
          <Link href={ROUTES.FIND_PASSWORD} className="text-primary-300 text-sm font-medium">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <Button size="md" className="bg-primary-300 w-full cursor-pointer text-white" type="submit">
          로그인
        </Button>
      </fieldset>
    </form>
  )
}
