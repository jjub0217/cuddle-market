'use client'

import Button from '@/components/commons/button/Button'
import AddressField from '@/components/commons/AddressField'
import { useForm } from 'react-hook-form'
import { type Province } from '@/constants/cities'
import { useState } from 'react'
import { NameField } from './NameField'
import { NicknameField } from './NicknameField'
import { EmailValidCode } from './EmailValidCode'
import { PasswordField } from './PasswordField'
import { BirthDateField } from './BirthDateField'
import { login, signup } from '@/lib/api/auth'
import type { SignUpRequestData } from '@/types'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import { isAxiosError } from 'axios'
import type { ToastType } from '@/types/toast'

export interface SignUpFormValues {
  email: string
  emailCode: string
  password: string
  passwordConfirm: string
  name: string
  nickname: string
  birthDate: string
  addressSido: Province | ''
  addressGugun: string
}

export function SignUpForm() {
  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    defaultValues: {
      email: '',
      emailCode: '',
      password: '',
      passwordConfirm: '',
      name: '',
      nickname: '',
      birthDate: '',
      addressSido: '',
      addressGugun: '',
    },
  })

  const [isNicknameVerified, setIsNicknameVerified] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isEmailCodeVerified, setIsEmailCodeVerified] = useState(false)
  const [signupNotification, setSignupNotification] = useState<{ message: string; type: ToastType } | null>(null)
  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const router = useRouter()

  const { handleLogin } = useUserStore()

  const onSubmit = async (data: SignUpFormValues) => {
    let hasError = false

    if (checkResult.status === 'error') {
      hasError = true
    } else if (!isNicknameVerified) {
      setError('nickname', {
        type: 'manual',
        message: '닉네임 중복 확인을 완료해주세요.',
      })
      hasError = true
    }

    if (!isEmailVerified) {
      setError('email', {
        type: 'manual',
        message: '이메일 중복 확인을 완료해주세요.',
      })
      hasError = true
    }

    if (!isEmailCodeVerified) {
      setError('emailCode', {
        type: 'manual',
        message: '이메일 인증을 완료해주세요.',
      })
      hasError = true
    }

    if (hasError) {
      return
    }

    const requestData: SignUpRequestData = {
      email: data.email,
      password: data.password,
      name: data.name,
      nickname: data.nickname,
      birthDate: data.birthDate,
      addressSido: data.addressSido,
      addressGugun: data.addressGugun,
    }

    try {
      await signup(requestData)
      const loginResponse = await login({
        email: data.email,
        password: data.password,
      })
      handleLogin(loginResponse.data.user, loginResponse.data.accessToken, loginResponse.data.refreshToken)

      const redirectUrl = useUserStore.getState().redirectUrl
      router.push(redirectUrl || '/')
      useUserStore.getState().setRedirectUrl(null)
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message

        if (status === 409) {
          setSignupNotification({ message: message || '이미 가입된 이메일입니다.', type: 'error' })
        } else if (status === 400) {
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
          <NameField register={register} errors={errors} />
          <NicknameField
            register={register}
            errors={errors}
            watch={watch}
            setIsNicknameVerified={setIsNicknameVerified}
            clearErrors={clearErrors}
            checkResult={checkResult}
            setCheckResult={setCheckResult}
          />
          <AddressField<SignUpFormValues> control={control} setValue={setValue} primaryName="addressSido" secondaryName="addressGugun" />
          <BirthDateField control={control} />
          <EmailValidCode
            register={register}
            errors={errors}
            watch={watch}
            setIsEmailVerified={setIsEmailVerified}
            setIsEmailCodeVerified={setIsEmailCodeVerified}
            clearErrors={clearErrors}
          />
          <PasswordField register={register} errors={errors} watch={watch} setError={setError} clearErrors={clearErrors} />
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
