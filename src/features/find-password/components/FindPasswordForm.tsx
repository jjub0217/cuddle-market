'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/commons/button/Button'
import { ROUTES } from '@/constants/routes'
import { useForm, useWatch } from 'react-hook-form'
import InputField from '@/components/commons/InputField'
import { authValidationRules, profileValidationRules } from '@/lib/utils/validation/authValidationRules'
import { useEffect, useMemo, useState } from 'react'
import RequiredLabel from '@/components/commons/RequiredLabel'
import InputWithButton from '@/components/commons/InputWithButton'
import { checkValidCode, reSettingPassword, sendValidCode } from '@/lib/api/profile'
import { isAxiosError } from 'axios'
import { StepIndicator } from './StepIndicator'
import { StepHeader } from './StepHeader'

interface FindPasswordFormValues {
  email: string
  AuthenticationCode: string
  password: string
  passwordConfirm: string
}

export function FindPasswordForm() {
  const [sendValidCodeResult, setSendValidCodeResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const [checkValidCodeResult, setCheckValidCodeResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null)
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
    clearErrors,
    control,
  } = useForm<FindPasswordFormValues>({
    defaultValues: {
      email: '',
      AuthenticationCode: '',
      password: '',
      passwordConfirm: '',
    },
  })
  const email = useWatch({ control, name: 'email' })
  const code = useWatch({ control, name: 'AuthenticationCode' })
  const password = useWatch({ control, name: 'password' })
  const passwordConfirm = useWatch({ control, name: 'passwordConfirm' })
  const router = useRouter()

  const passwordConfirmResult = useMemo(() => {
    if (passwordResetError) {
      return { status: 'error' as const, message: passwordResetError }
    }
    if (passwordConfirm && password && password === passwordConfirm) {
      return { status: 'success' as const, message: '비밀번호가 일치합니다.' }
    }
    return { status: 'idle' as const, message: '' }
  }, [password, passwordConfirm, passwordResetError])

  const currentStep: 1 | 2 | 3 = checkValidCodeResult.status !== 'idle' ? 3 : sendValidCodeResult.status !== 'idle' ? 2 : 1

  const onSubmit = async () => {
    try {
      await sendValidCode(email)
      setSendValidCodeResult({
        status: 'success',
        message: '인증 번호를 발송했습니다.',
      })
    } catch (error) {
      console.error('인증코드 전송 실패:', error)
      if (isAxiosError(error)) {
        setSendValidCodeResult({
          status: 'error',
          message: error.response?.data?.message || '인증코드 전송에 실패했습니다.',
        })
      } else {
        setSendValidCodeResult({
          status: 'error',
          message: '네트워크 오류가 발생했습니다.',
        })
      }
    }
  }

  const onVerifyCode = async () => {
    try {
      await checkValidCode(email, String(code))
      setCheckValidCodeResult({
        status: 'success',
        message: '',
      })
    } catch (error) {
      console.error('인증코드 확인 실패:', error)
      if (isAxiosError(error)) {
        setCheckValidCodeResult({
          status: 'error',
          message: error.response?.data?.message || '만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.',
        })
      } else {
        setCheckValidCodeResult({
          status: 'error',
          message: '네트워크 오류가 발생했습니다.',
        })
      }
    }
  }

  const handlePreviousStep = () => {
    setSendValidCodeResult({ status: 'idle', message: '' })
    setCheckValidCodeResult({ status: 'idle', message: '' })
  }

  const onReSettingPassword = async () => {
    setPasswordResetError(null)
    try {
      await reSettingPassword({
        email,
        newPassword: password,
        confirmPassword: passwordConfirm,
      })
      setTimeout(() => {
        router.push(ROUTES.LOGIN)
      }, 1500)
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      if (isAxiosError(error)) {
        setPasswordResetError(error.response?.data?.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
      } else {
        setPasswordResetError('네트워크 오류가 발생했습니다.')
      }
    }
  }

  useEffect(() => {
    if (passwordConfirm && password) {
      if (password === passwordConfirm) {
        clearErrors('passwordConfirm')
      } else {
        setError('passwordConfirm', {
          type: 'manual',
          message: '비밀번호가 일치하지 않습니다.',
        })
      }
    }
  }, [password, passwordConfirm, setError, clearErrors])

  return (
    <form className="w-full rounded-[20px] bg-white px-10 py-10" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">비밀번호 찾기</legend>

        <div className="flex flex-col items-center gap-6">
          <StepIndicator currentStep={currentStep} />
          <div className="flex w-full flex-col gap-12">
            <StepHeader currentStep={currentStep} email={email} />
            {checkValidCodeResult.status === 'success' ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <RequiredLabel required={false} labelClass="font-medium">
                      새 비밀번호
                    </RequiredLabel>
                    <InputField
                      id="resetting-password"
                      type="password"
                      placeholder="10자 이상 입력해주세요(영문 대소문자, 숫자, 특수문자 포함)"
                      size="text-sm"
                      border
                      borderColor="border-gray-400"
                      error={errors.password}
                      registration={register('password', profileValidationRules.newPassword)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <RequiredLabel required={false} labelClass="font-medium">
                      새 비밀번호 확인
                    </RequiredLabel>
                    <InputField
                      id="signup-password-confirm"
                      type="password"
                      placeholder="비밀번호를 다시 입력해주세요"
                      size="text-sm"
                      border
                      borderColor="border-gray-400"
                      error={errors.passwordConfirm}
                      checkResult={passwordConfirmResult}
                      registration={register('passwordConfirm', profileValidationRules.confirmPassword(password))}
                    />
                  </div>
                </div>
                <Button size="md" className="w-full cursor-pointer bg-[#22C55E] text-white" type="button" onClick={onReSettingPassword}>
                  비밀번호 변경 완료
                </Button>
              </div>
            ) : sendValidCodeResult.status !== 'idle' ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <RequiredLabel required={false} labelClass="font-medium">
                    인증코드
                  </RequiredLabel>
                  <InputWithButton
                    id="find-password-code"
                    type="text"
                    placeholder="6자리 인증코드 입력"
                    error={errors.AuthenticationCode}
                    checkResult={checkValidCodeResult.status !== 'idle' ? checkValidCodeResult : sendValidCodeResult}
                    registration={register('AuthenticationCode', authValidationRules.emailCode)}
                    buttonText="재전송"
                    onButtonClick={() => onSubmit()}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <Button size="md" className="bg-primary-300 w-full cursor-pointer text-white" type="button" onClick={onVerifyCode}>
                    인증하기
                  </Button>
                  <Button
                    size="md"
                    className="w-full cursor-pointer border border-gray-400 bg-white text-gray-900"
                    type="button"
                    onClick={handlePreviousStep}
                  >
                    이전단계
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <RequiredLabel required={false} labelClass="font-medium">
                    이메일
                  </RequiredLabel>
                  <InputField
                    type="email"
                    placeholder="이메일 (example@cuddle.com)"
                    backgroundColor="bg-white"
                    size="text-sm"
                    error={errors.email}
                    border
                    borderColor="border-gray-400"
                    registration={register('email', authValidationRules.email)}
                  />
                </div>
                <Button size="md" className="bg-primary-300 w-full cursor-pointer text-white" type="submit">
                  인증코드 전송
                </Button>
                <Link href={ROUTES.LOGIN} className="text-primary-300 w-full text-center font-medium">
                  로그인으로 돌아가기
                </Link>
              </div>
            )}
          </div>
        </div>
      </fieldset>
    </form>
  )
}
