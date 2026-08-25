'use client'

import Button from '@/components/commons/button/Button'
import AddressField from '@/components/commons/AddressField'
import { useForm, useWatch } from 'react-hook-form'
import { type Province } from '@/constants/cities'
import { useState } from 'react'
import { NameField } from './NameField'
import { NicknameField } from './NicknameField'
import { EmailValidCode } from './EmailValidCode'
import { PasswordField } from './PasswordField'
import { BirthDateField } from './BirthDateField'
import { ConsentFields } from './ConsentFields'
import { login, signup } from '@/lib/api/auth'
import type { SignUpRequestData } from '@/types'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import { isAxiosError } from 'axios'
import type { ToastType } from '@/types/toast'
import { TitleSection } from '@/features/login/components/TitleSection'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

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
  agreeTerms: boolean
  agreePrivacy: boolean
}

export function SignUpForm() {
  const {
    control,
    handleSubmit,
    register,
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
      agreeTerms: false,
      agreePrivacy: false,
    },
  })

  const [isNicknameVerified, setIsNicknameVerified] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isEmailCodeVerified, setIsEmailCodeVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupNotification, setSignupNotification] = useState<{ message: string; type: ToastType } | null>(null)
  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const router = useRouter()

  // 동의 둘을 다 해야 가입 단추가 켜진다(#1088).
  //
  // `watch()` 가 아니라 `useWatch` 를 쓰는 까닭: 이 폼은 칸이 아홉이라 `watch()` 를 쓰면
  // 한 글자 칠 때마다 폼 전체가 다시 그려진다. 이름을 집어 주면 그 둘이 바뀔 때만 그린다.
  const [agreeTerms, agreePrivacy] = useWatch({ control, name: ['agreeTerms', 'agreePrivacy'] })
  const hasAllConsents = agreeTerms === true && agreePrivacy === true

  const { handleLogin } = useUserStore()

  const onSubmit = async (data: SignUpFormValues) => {
    // ⚠️ **단추를 끄는 것만으로는 못 막는다.** `disabled` 는 화면의 일이고, 폼은
    //    엔터키로도 프로그램 호출로도 제출된다. 여기서 한 번 더 막아야
    //    가입 API 가 정말 안 불린다.
    //    (ConsentFields 의 `required` 가 handleSubmit 단계에서 이미 막지만,
    //     그 등록을 누가 지워도 이 줄이 남아 있으면 가입은 안 일어난다)
    if (!data.agreeTerms || !data.agreePrivacy) {
      return
    }

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

    if (!isEmailVerified || !isEmailCodeVerified) {
      setError('emailCode', {
        type: 'manual',
        message: '이메일 인증을 완료해주세요.',
      })
      hasError = true
    }

    if (hasError) {
      return
    }

    setIsSubmitting(true)

    const requestData: SignUpRequestData = {
      email: data.email,
      password: data.password,
      name: data.name,
      nickname: data.nickname,
      birthDate: data.birthDate,
      addressSido: data.addressSido,
      addressGugun: data.addressGugun,
      termsAgreed: true,
      privacyAgreed: true,
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
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="bg-surface border-outline-variant/10 flex w-full flex-col gap-14 rounded-3xl border px-6 py-8 shadow-lg md:px-10 md:py-7 md:shadow-2xl"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="hidden md:block">
        <TitleSection title="회원가입" desc="몇 가지 정보만 입력하면 바로 시작할 수 있어요" size="sm" />
      </div>
      <fieldset className="flex flex-col gap-9">
        <legend className="sr-only">회원가입폼</legend>
        <div className="flex flex-col gap-6">
          <EmailValidCode
            register={register}
            errors={errors}
            control={control}
            setValue={setValue}
            setIsEmailVerified={setIsEmailVerified}
            setIsEmailCodeVerified={setIsEmailCodeVerified}
            clearErrors={clearErrors}
          />
          <PasswordField register={register} errors={errors} control={control} setError={setError} clearErrors={clearErrors} />
          <NameField register={register} errors={errors} />
          <NicknameField
            register={register}
            errors={errors}
            control={control}
            setIsNicknameVerified={setIsNicknameVerified}
            clearErrors={clearErrors}
            checkResult={checkResult}
            setCheckResult={setCheckResult}
          />
          <BirthDateField control={control} />
          <AddressField<SignUpFormValues>
            control={control}
            setValue={setValue}
            primaryName="addressSido"
            secondaryName="addressGugun"
            labelClass="text-sm"
            layoutClass="gap-0"
          />
          <ConsentFields<SignUpFormValues> register={register} />
        </div>
        <AnimatePresence>
          {signupNotification ? (
            <InlineNotification type={signupNotification.type} onClose={() => setSignupNotification(null)}>
              {signupNotification.message}
            </InlineNotification>
          ) : null}
        </AnimatePresence>
        <Button
          size="md"
          className="bg-primary-600 hover:bg-primary-700 w-full cursor-pointer text-white transition-colors"
          type="submit"
          disabled={isSubmitting || !hasAllConsents}
        >
          {isSubmitting ? '가입 중...' : '회원가입'}
        </Button>
        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary font-semibold hover:underline">
            로그인하기
          </Link>
        </p>
      </fieldset>
    </form>
  )
}
