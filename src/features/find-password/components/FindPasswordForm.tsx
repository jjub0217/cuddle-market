'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/commons/button/Button'
import { ROUTES } from '@/constants/routes'
import { useForm } from 'react-hook-form'
import { InputField } from '@/components/commons/InputField'
import { authValidationRules, profileValidationRules } from '@/lib/utils/validation/authValidationRules'
import { useEffect, useState } from 'react'
import { RequiredLabel } from '@/components/commons/RequiredLabel'
import { InputWithButton } from '@/components/commons/InputWithButton'
import { checkValidCode, reSettingPassword, sendValidCode } from '@/lib/api/profile'
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
  const [passwordConfirmResult, setPasswordConfirmResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const {
    handleSubmit, // form onSubmit에 들어가는 함수 : 제출 시 실행할 함수를 감싸주는 함수
    register, // onChange 등의 이벤트 객체 생성 : input에 "이 필드는 폼의 어떤 이름이다"라고 연결해주는 함수
    formState: { errors }, // errors: register의 에러 메세지 자동 출력 : 각 필드의 에러 상태
    setError,
    clearErrors,
    watch,
  } = useForm<FindPasswordFormValues>({
    defaultValues: {
      email: '',
      AuthenticationCode: '',
      password: '',
      passwordConfirm: '',
    },
  }) // 폼에서 관리할 필드들의 타입(이름) 정의.
  const email = watch('email')
  const code = watch('AuthenticationCode')
  const password = watch('password')
  const passwordConfirm = watch('passwordConfirm')
  const router = useRouter()

  const currentStep: 1 | 2 | 3 = checkValidCodeResult.status !== 'idle' ? 3 : sendValidCodeResult.status !== 'idle' ? 2 : 1

  const onSubmit = async () => {
    try {
      await sendValidCode(email)
      setSendValidCodeResult({
        status: 'success',
        message: '인증 번호를 발송했습니다.',
      })
    } catch {
      setSendValidCodeResult({
        status: 'error',
        message: '인증코드 오류. 인증코드를 다시 받아주세요.',
      })
    }
  }

  const onVerifyCode = async () => {
    try {
      await checkValidCode(email, String(code))
      // 성공 시: 다음 단계로 이동 (비밀번호 재설정)
      setCheckValidCodeResult({
        status: 'success',
        message: '',
      })
    } catch {
      setCheckValidCodeResult({
        status: 'error',
        message: '만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.',
      })
    }
  }
  const onReSettingPassword = async () => {
    try {
      await reSettingPassword({
        email,
        newPassword: password,
        confirmPassword: passwordConfirm,
      })
      setTimeout(() => {
        router.push(ROUTES.LOGIN)
      }, 1500)
    } catch {
      setPasswordConfirmResult({
        status: 'error',
        message: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.',
      })
    }
  }

  useEffect(() => {
    if (passwordConfirm && password) {
      if (password === passwordConfirm) {
        setPasswordConfirmResult({
          status: 'success',
          message: '비밀번호가 일치합니다.',
        })
        clearErrors('passwordConfirm')
      } else {
        setPasswordConfirmResult({
          status: 'idle',
          message: '',
        })
        setError('passwordConfirm', {
          type: 'manual',
          message: '비밀번호가 일치하지 않습니다.',
        })
      }
    } else {
      setPasswordConfirmResult({
        status: 'idle',
        message: '',
      })
    }
  }, [password, passwordConfirm, setError, clearErrors])
  return (
    <form className="w-full rounded-[20px] bg-white px-10 py-10" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">로그인폼</legend>

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
                      registration={register('passwordConfirm', profileValidationRules.confirmPassword(watch('password')))}
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
                    onClick={onVerifyCode}
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
