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
  // 「인증코드를 실제로 받아 낸 적이 있는가」. 단계를 앞으로 미는 건 이 값 하나뿐이다.
  //
  // sendValidCodeResult는 **마지막 전송의 결과 문구**를 담는 자리라서 단계 판단에는 못 쓴다.
  // 2단계에서 「재전송」이 실패하면 그 값이 'error'로 바뀌는데, 그걸로 단계를 정하면
  // 이미 코드를 받아 넣고 있던 사용자가 1단계로 튕겨 나가 넣던 코드를 잃는다.
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null)
  // 바꾸기에 성공했는가. 로그인 화면으로 넘어가기까지 1.5초 동안 이 값으로 알림을 띄운다.
  const [resetDone, setResetDone] = useState(false)
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

  const passwordMatchResult = useMemo(() => {
    if (passwordConfirm && password && password === passwordConfirm) {
      return { status: 'success' as const, message: '비밀번호가 일치합니다.' }
    }
    return { status: 'idle' as const, message: '' }
  }, [password, passwordConfirm])

  const passwordConfirmResult = useMemo(() => {
    if (passwordResetError) {
      return { status: 'error' as const, message: passwordResetError }
    }
    return passwordMatchResult
  }, [passwordResetError, passwordMatchResult])

  // 성공했을 때만 다음 단계로 민다.
  //
  // 예전에는 `!== 'idle'`이었다. 상태가 셋(idle·success·error)이라 실패도 참이 되어,
  // 소셜 가입 이메일(400 「소셜 로그인 사용자는…」)이나 탈퇴한 계정 이메일처럼
  // 서버가 거절한 경우에도 인증코드 칸으로 넘어가 버렸다.
  //
  // 아래 그리는 쪽의 조건과 **같은 값**을 봐야 한다. 예전에는 단계 표시(StepIndicator·
  // StepHeader)와 실제 칸이 서로 다른 조건을 봐서, 코드를 틀리면 칸은 2단계인데
  // 표시만 3단계로 바뀌는 어긋남이 있었다.
  const currentStep: 1 | 2 | 3 = checkValidCodeResult.status === 'success' ? 3 : isCodeSent ? 2 : 1

  const onSubmit = async () => {
    // 재전송이면 앞서 뜬 코드 확인 결과를 지운다. 안 지우면 「만료된 인증 코드입니다」 같은
    // 옛 오류가 새로 보낸 결과 문구를 계속 가린다.
    setCheckValidCodeResult({ status: 'idle', message: '' })
    try {
      await sendValidCode(email)
      setIsCodeSent(true)
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
    setIsCodeSent(false)
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
      setResetDone(true)
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
                    <RequiredLabel required={false} labelClass="font-medium text-sm">
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
                {/* 1.5초 뒤 로그인 화면으로 넘어간다. 그동안 아무 말도 없으면
                    「눌렀는데 멈췄다가 갑자기 화면이 바뀐」 것으로 보인다.
                    앱은 토스트로 같은 말을 한다(#838). */}
                {resetDone ? (
                  <p className="text-success-500 text-sm font-semibold">
                    비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.
                  </p>
                ) : null}
                <Button
                  size="md"
                  className="w-full cursor-pointer bg-[#22C55E] text-white"
                  type="button"
                  onClick={onReSettingPassword}
                >
                  비밀번호 변경 완료
                </Button>
              </div>
            ) : isCodeSent ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <RequiredLabel required={false} labelClass="font-medium text-sm">
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
                  <Button
                    size="md"
                    className="bg-primary-600 w-full cursor-pointer text-white"
                    type="button"
                    onClick={onVerifyCode}
                  >
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
                  <RequiredLabel required={false} labelClass="font-medium text-sm">
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
                    // 전송이 실패하면 1단계에 머무르므로, 실패 사유를 보여 줄 자리도 여기여야 한다.
                    // 이게 없으면 서버가 거절한 이유(소셜 가입 이메일·없는 계정)를 아무도 못 본다.
                    checkResult={sendValidCodeResult.status === 'error' ? sendValidCodeResult : undefined}
                    registration={register('email', authValidationRules.email)}
                  />
                </div>
                {/* 서버가 막았을 때 「안 된다」로 끝내지 않고 갈 길을 준다.
                    여기 온 사람은 대개 카카오·구글로 가입한 걸 잊고 이메일 로그인을 하려다 온 사람이다.
                    앱도 같은 안내를 한다(#838). */}
                {sendValidCodeResult.status === 'error' && sendValidCodeResult.message.includes('소셜') ? (
                  <div className="bg-surface-container-low flex flex-col gap-3 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      카카오·구글로 가입한 계정이에요.
                      <br />그 방법으로 로그인해주세요.
                    </p>
                    <Link
                      href={ROUTES.LOGIN}
                      className="bg-primary-100 text-primary rounded-lg px-4 py-2 text-center text-sm font-semibold"
                    >
                      로그인하러 가기
                    </Link>
                  </div>
                ) : null}
                <Button size="md" className="bg-primary-600 w-full cursor-pointer text-sm text-white" type="submit">
                  인증코드 전송
                </Button>
                <Link href={ROUTES.LOGIN} className="text-primary w-full text-center text-sm font-medium">
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
