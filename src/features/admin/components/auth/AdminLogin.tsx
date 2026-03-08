'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { login } from '@/lib/api/auth'
import { api } from '@/lib/api/api'
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

    let loginResponse
    try {
      loginResponse = await login({ email: data.email, password: data.password })
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    const { user, accessToken, refreshToken } = loginResponse.data

    try {
      // 토큰만 임시 세팅하여 /profile/me 호출 가능하게 함
      useUserStore.getState().setAccessToken(accessToken)

      const profileRes = await api.get('/profile/me')
      const { userRole } = profileRes.data.data

      if (userRole !== 'ADMIN') {
        useUserStore.getState().clearAll()
        setError('관리자 권한이 없는 계정입니다.')
        return
      }

      // ADMIN 확인 후 최종 로그인 처리
      handleLogin(user, accessToken, refreshToken)
      router.push(ROUTES.ADMIN)
    } catch {
      useUserStore.getState().clearAll()
      setError('권한 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200">
      <div className="w-1/5 max-w-115 min-w-80 overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="bg-primary-50 flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <Logo textClassname="text-primary-200" />
            </div>

            <h2 className="text-center text-2xl font-bold text-gray-900">관리자 로그인</h2>
          </div>
          <p className="pt-5 text-center text-sm text-gray-500">
            <span className="text-[#F6A818]">admin 계정</span>을 통해 로그인을 진행해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          <div>
            <input
              type="email"
              placeholder="아이디 (example@gmail.com)"
              autoComplete="email"
              className="w-full rounded border border-gray-300 px-4 py-2 text-sm transition-colors outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              {...register('email', authValidationRules.email)}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="비밀번호 (6~15자의 영문 대소문자, 숫자, 특수문자 포함)"
              autoComplete="current-password"
              className="w-full rounded border border-gray-300 px-4 py-2 text-sm transition-colors outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              {...register('password', { required: '비밀번호를 입력해주세요' })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-200 w-full cursor-pointer rounded py-3 font-semibold text-white transition-colors hover:bg-blue-300 disabled:opacity-50"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
