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
  // 결과에 **어느 이메일에 대한 것인지**를 함께 담는다.
  //
  // 이게 없으면 이메일을 고쳐도 옛 판단이 남아 화면이 거짓말을 한다 — 소셜 이메일로 막힌 뒤
  // 다른 이메일을 넣었는데 「소셜 계정이에요」가 그대로 보였다(2026-08-05 신고).
  // useEffect 로 지우는 방법도 있지만, 효과 안에서 setState 를 하면 렌더가 연쇄된다
  // (lint 가 막는다). 값을 비교해 **그릴 때 거르는** 편이 단순하고 틀릴 여지가 없다.
  const [sendValidCodeResult, setSendValidCodeResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
    email: string
  }>({ status: 'idle', message: '', email: '' })
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

  // 막다른 길 안내. 「고쳐서 다시 하세요」(칸 아래 오류)와 성격이 달라 모양도 다르게 둔다 —
  // 이건 「여기 말고 저쪽으로 가세요」다. 앱도 같은 규칙이다(app/find-password.tsx).
  //
  // ⚠️ 소셜인지 아닌지는 **서버 문구**로 가릴 수밖에 없다. 서버가 오류를 전부
  //    code: 'BAD_REQUEST' 로 내려서 다른 단서가 없다(GlobalExceptionHandler:99).
  /** 지금 칸에 있는 이메일에 대한 결과인가. 아니면 옛 판단이라 안 보여준다. */
  const resultIsCurrent = sendValidCodeResult.email === email

  const blocked: 'social' | 'notFound' | null =
    sendValidCodeResult.status !== 'error' || !resultIsCurrent
      ? null
      : sendValidCodeResult.message.includes('소셜')
        ? 'social'
        : 'notFound'
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
        email,
      })
    } catch (error) {
      console.error('인증코드 전송 실패:', error)
      if (isAxiosError(error)) {
        setSendValidCodeResult({
          status: 'error',
          message: error.response?.data?.message || '인증코드 전송에 실패했습니다.',
          email,
        })
      } else {
        setSendValidCodeResult({
          status: 'error',
          message: '네트워크 오류가 발생했습니다.',
          email,
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
    setSendValidCodeResult({ status: 'idle', message: '', email: '' })
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
                    // 막다른 길(소셜·없는 이메일)은 아래 박스가 말한다. 여기까지 띄우면
                    // 같은 말이 두 줄로 겹친다. 그 밖의 실패(네트워크 등)만 칸 아래에 남긴다.
                    checkResult={
                      sendValidCodeResult.status === 'error' && resultIsCurrent && blocked === null
                        ? sendValidCodeResult
                        : undefined
                    }
                    registration={register('email', authValidationRules.email)}
                  />
                </div>
                {/* 서버가 막았을 때 「안 된다」로 끝내지 않고 갈 길을 준다.
                    여기 온 사람은 대개 카카오·구글로 가입한 걸 잊고 이메일 로그인을 하려다 온 사람이다.
                    앱도 같은 안내를 한다(#838). */}
                {blocked ? (
                  <div className="bg-surface-container-low flex flex-col gap-3 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {blocked === 'social' ? (
                        <>
                          카카오·구글로 가입한 계정이에요.
                          <br />그 방법으로 로그인해주세요.
                        </>
                      ) : (
                        <>
                          가입 이력이 없는 이메일이에요.
                          <br />
                          이메일을 다시 확인해주세요.
                        </>
                      )}
                    </p>
                    <Link
                      href={blocked === 'social' ? ROUTES.LOGIN : ROUTES.SIGNUP}
                      className="bg-primary-100 text-primary rounded-lg px-4 py-2 text-center text-sm font-semibold"
                    >
                      {blocked === 'social' ? '로그인하러 가기' : '회원가입하러 가기'}
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
