'use client'

import { Button } from '@/components/commons/button/Button'
import { AddressField } from '@/components/commons/AddressField'
import { useForm } from 'react-hook-form'
import { type Province } from '@/constants/cities'
import { useState } from 'react'
import { BirthDateField } from './BirthDateField'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import { isAxiosError } from 'axios'
import type { ToastType } from '@/types/toast'
import type { SocialSignUpRequestData } from '@/types/auth'
import { api } from '@/lib/api/api'
import { NicknameField } from './NicknameField'

export interface SocialSignUpFormValues {
  birthDate: string
  nickname: string
  addressSido: Province | ''
  addressGugun: string
}

export function SocialSignUpForm() {
  // const user = useUserStore((state) => state.user)
  // In Next.js, we use sessionStorage instead of location.state
  const [user] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('socialSignupUser')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })
  const {
    control,
    register,
    watch,
    setError,
    clearErrors,
    handleSubmit, // form onSubmit에 들어가는 함수 : 제출 시 실행할 함수를 감싸주는 함수
    setValue,
    formState: { errors },
  } = useForm<SocialSignUpFormValues>({
    defaultValues: {
      nickname: user?.nickname || '',
      birthDate: '',
      addressSido: '',
      addressGugun: '',
    },
  }) // 폼에서 관리할 필드들의 타입(이름) 정의.
  const [isNicknameVerified, setIsNicknameVerified] = useState(false)
  const [signupNotification, setSignupNotification] = useState<{ message: string; type: ToastType } | null>(null)
  const router = useRouter()

  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const onSubmit = async (data: SocialSignUpFormValues) => {
    // 검증 완료 여부 확인
    let hasError = false

    // if (!isNicknameVerified) {
    //   setError('nickname', {
    //     type: 'manual',
    //     message: '닉네임 중복 확인을 완료해주세요.',
    //   })
    //   hasError = true
    // }

    if (checkResult.status === 'error') {
      // 이미 중복 에러가 표시되어 있으므로 추가 에러 메시지 불필요
      hasError = true
    } else if (!isNicknameVerified) {
      // 중복체크를 아예 안 한 경우에만 "닉네임 중복 확인을 완료해주세요" 표시
      setError('nickname', {
        type: 'manual',
        message: '닉네임 중복 확인을 완료해주세요.',
      })
      hasError = true
    }

    if (hasError) {
      return
    }

    const requestData: SocialSignUpRequestData = {
      nickname: data?.nickname || '',
      birthDate: data.birthDate,
      addressSido: data.addressSido,
      addressGugun: data.addressGugun,
    }

    try {
      // 업데이트된 유저 정보를 store에 반영
      const userResponse = await api.patch('/profile/me', requestData)
      const user = userResponse.data.data

      useUserStore.getState().setUser(user)

      const redirectUrl = useUserStore.getState().redirectUrl
      router.push(redirectUrl || '/')
      useUserStore.getState().setRedirectUrl(null)
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 400) {
          setSignupNotification({ message: message || '입력 정보를 다시 확인해주세요.', type: 'error' })
        } else {
          setSignupNotification({ message: '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', type: 'warning' })
        }
      } else {
        setSignupNotification({ message: '네트워크 연결을 확인해주세요.', type: 'warning' })
      }
    }
  }

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-9">
        <legend className="sr-only">회원가입폼</legend>
        <div className="flex flex-col gap-6">
          <NicknameField
            register={register}
            errors={errors}
            watch={watch}
            setIsNicknameVerified={setIsNicknameVerified}
            clearErrors={clearErrors}
            checkResult={checkResult}
            setCheckResult={setCheckResult}
          />
          <AddressField<SocialSignUpFormValues> control={control} setValue={setValue} primaryName="addressSido" secondaryName="addressGugun" />
          <BirthDateField control={control} />
        </div>
        <AnimatePresence>
          {signupNotification && (
            <InlineNotification type={signupNotification.type} onClose={() => setSignupNotification(null)}>
              {signupNotification.message}
            </InlineNotification>
          )}
        </AnimatePresence>
        <Button size="md" className="bg-primary-300 w-full cursor-pointer text-white" type="submit">
          회원가입
        </Button>
      </fieldset>
    </form>
  )
}
