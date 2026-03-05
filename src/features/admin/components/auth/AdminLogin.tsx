'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { login } from '@/lib/api/auth'
import { useUserStore } from '@/store/userStore'
import { ROUTES } from '@/constants/routes'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'

interface AdminLoginForm {
  email: string
  password: string
}

export default function AdminLogin() {
  const router = useRouter()
  const handleLogin = useUserStore((s) => s.handleLogin)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginForm>()

  const onSubmit = async (data: AdminLoginForm) => {
    setError('')
    try {
      const response = await login({ email: data.email, password: data.password })
      const { user, accessToken, refreshToken } = response.data
      handleLogin(user, accessToken, refreshToken)
      router.push(ROUTES.ADMIN)
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200">
      <div className="w-fit rounded-2xl bg-white p-10 shadow-lg">
        <div className="mb-6 flex justify-center">
          <Logo textClassname="text-gray-800" />
        </div>

        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">관리자 로그인</h2>
        <p className="mb-8 text-center text-sm text-gray-500">
          <span className="font-semibold text-blue-500">admin 계정</span>을 통해 로그인을 진행해주세요.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="아이디 (example@gmail.com)"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              {...register('email', authValidationRules.email)}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="비밀번호 (6~15자의 영문 대소문자, 숫자, 특수문자 포함)"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              {...register('password', { required: '비밀번호를 입력해주세요' })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-200 py-3 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-300 disabled:opacity-50"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
