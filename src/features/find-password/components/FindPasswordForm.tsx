'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/commons/button/Button'
import { ROUTES } from '@/constants/routes'
import { useForm, useWatch } from 'react-hook-form'
import InputField from '@/components/commons/InputField'
import { authValidationRules, profileValidationRules } from '@/lib/utils/validation/authValidationRules'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
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

/** 서버 만료가 5분이다(EmailVerificationServiceImpl 의 VERIFICATION_CODE_EXPIRY_MINUTES). */
const CODE_TTL_SECONDS = 300

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// 이 화면은 높이를 **따로 못 박지 않는다.** 공용 조각의 기본값(40)을 그대로 쓴다.
//
// 전에는 여기서 h-12(48)로 덮어썼다. 공용 조각이 저마다 다른 높이여서 한 화면에
// 여럿이 섞였기 때문이다(2026-08-05 실측):
//   이메일 칸 46 · 인증코드 전송 40 · 인증코드 칸 46 · 재전송 44 · 이메일 변경 40 · 인증하기 40
// 특히 나란히 붙은 인증코드 칸(46)과 재전송(44)의 2px 이 제일 눈에 띄었다.
//
// #847 에서 공용 조각을 고쳐 Input 도 Button(md)도 40 이 됐으므로 덮어쓸 이유가 없어졌다.
// 로그인·회원가입 화면도 같은 40 이다.

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
  /** 인증코드가 만료되기까지 남은 초. 0이면 안 돌고 있다는 뜻이다. */
  const [secondsLeft, setSecondsLeft] = useState(0)
  /**
   * 시간이 다 돼서 1단계로 되돌아왔을 때 알리는 말.
   *
   * ⚠️ sendValidCodeResult 에 얹지 않는다 — 그 값은 이메일 칸 아래 오류 문구로 그대로
   *    나가는 값이라, 만료 안내를 얹으면 「서버가 거절했다」처럼 보인다.
   *    (#849 이전에는 여기에 「막다른 길」 박스까지 걸려 있었다. 그 갈래는 걷어냈다.)
   */
  const [expiredNotice, setExpiredNotice] = useState('')
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

  /** 시간이 다 됐을 때 1단계로 되돌린다. 만료된 코드를 계속 넣게 두면 헷갈린다. */
  const resetToStep1 = (notice: string) => {
    setIsCodeSent(false)
    setSecondsLeft(0)
    setCheckValidCodeResult({ status: 'idle', message: '' })
    setSendValidCodeResult({ status: 'idle', message: '', email: '' })
    setExpiredNotice(notice)
  }

  // ⚠️ 되돌리는 함수를 아래 effect 의 의존성에 넣으면 매 렌더마다 타이머가 다시 걸린다.
  //    그렇다고 렌더 중에 ref 에 대입하면 React Compiler 가 막는다(렌더는 순수해야 한다).
  //    그래서 대입도 effect 안에서 한다 — 웹 회원가입이 같은 함정을 같은 방식으로 푼다
  //    (EmailValidCode.tsx).
  const resetRef = useRef(resetToStep1)
  useEffect(() => {
    resetRef.current = resetToStep1
  })

  useEffect(() => {
    if (!isCodeSent) return

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          resetRef.current('인증 시간이 지났어요. 다시 받아주세요.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [isCodeSent])

  const onSubmit = async () => {
    // 재전송이면 앞서 뜬 코드 확인 결과를 지운다. 안 지우면 「만료된 인증 코드입니다」 같은
    // 옛 오류가 새로 보낸 결과 문구를 계속 가린다.
    setCheckValidCodeResult({ status: 'idle', message: '' })
    setExpiredNotice('')
    try {
      await sendValidCode(email)
      setIsCodeSent(true)
      setSecondsLeft(CODE_TTL_SECONDS - 1) // 화면에 4:59부터 보이게 한다
      setSendValidCodeResult({
        status: 'success',
        message: '인증 번호를 발송했습니다.',
        email,
      })
    } catch (error) {
      console.error('인증코드 전송 실패:', error)
      if (isAxiosError(error)) {
        // ⚠️ **서버 문구(error.response.data.message)를 화면에 옮기지 않는다**(#849).
        //    예전에는 그대로 뿌렸고, 그 문구가 「카카오로 가입한 계정입니다」였다 —
        //    남의 이메일을 넣어 본 사람에게 가입 여부와 가입 경로를 그대로 알려준 셈이다.
        //    막다른 길 박스를 걷어내도 **이 줄이 남아 있으면 구멍은 그대로다.**
        //    (2026-08-25: 박스만 지웠다가 이 줄로 새는 것을 시험이 잡아냈다)
        setSendValidCodeResult({
          status: 'error',
          message: '인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.',
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
    setSecondsLeft(0)
    setExpiredNotice('')
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
                      border
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
                      border
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
                    // 전송 **성공** 문구는 안 띄운다 — 바로 위 헤더가 이미 같은 말을 한다
                    // (「○○○로 인증코드를 발송했습니다」). 초록 줄이 하나 더 붙어 보였다.
                    // 다만 재전송 **실패**는 여기 말고 말할 자리가 없으므로 남긴다.
                    checkResult={
                      checkValidCodeResult.status !== 'idle'
                        ? checkValidCodeResult
                        : sendValidCodeResult.status === 'error'
                          ? sendValidCodeResult
                          : undefined
                    }
                    registration={register('AuthenticationCode', authValidationRules.emailCode)}
                    buttonText="재전송"
                    onButtonClick={() => onSubmit()}
                  />
                  {/* 서버 코드는 5분 뒤 만료된다. 그 사실을 알리는 것이 없으면 메일을 기다리다
                      스팸함을 뒤지다 5분이 지나고, **코드를 다 넣은 뒤에야** 만료를 알게 된다.
                      1분이 남으면 붉게 바꾼다 — 회색으로만 두면 곧 만료된다는 걸 못 알아챈다
                      (앱도 같은 규칙이다). */}
                  <p className={cn('text-xs', secondsLeft <= 60 ? 'text-danger-500' : 'text-gray-500')}>
                    남은 시간 {mmss(secondsLeft)} · 이메일로 받은 인증코드를 입력해주세요.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5">
                  {/* 「이전단계」가 아니라 「이메일 변경」이라 쓴다 — 시스템 말투 대신 목적을
                      말해야 알아본다. 위 안내문에 방금 넣은 이메일이 보이는데 오타를
                      발견해도 무엇을 눌러야 할지 몰랐다. 앱도 같은 말을 쓴다.
                      되돌아가는 길을 위에, 앞으로 가는 길(인증하기)을 아래에 둔다. */}
                  <Button
                    size="md"
                    className="w-full cursor-pointer border border-gray-400 bg-white text-gray-900"
                    type="button"
                    onClick={handlePreviousStep}
                  >
                    이메일 변경
                  </Button>
                  <Button
                    size="md"
                    className="bg-primary-600 w-full cursor-pointer text-white"
                    type="button"
                    onClick={onVerifyCode}
                  >
                    인증하기
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
                    error={errors.email}
                    border
                    // 막다른 길(소셜·없는 이메일)은 아래 박스가 말한다. 여기까지 띄우면
                    // 같은 말이 두 줄로 겹친다. 그 밖의 실패(네트워크 등)만 칸 아래에 남긴다.
                    checkResult={
                      expiredNotice
                        ? { status: 'error', message: expiredNotice }
                        : sendValidCodeResult.status === 'error' && resultIsCurrent
                          ? sendValidCodeResult
                          : undefined
                    }
                    registration={register('email', authValidationRules.email)}
                  />
                </div>
                {/* ⚠️ **막다른 길 안내(blocked)를 걷어냈다**(#849 2단계).
                    예전에는 서버 오류 문구를 뒤져서 「카카오로 가입한 계정이에요」·
                    「가입된 계정을 찾지 못했어요」 박스를 띄웠다. 그런데 그 안내가
                    곧 **남의 이메일을 넣어 본 사람에게 주는 답**이었다(계정 열거).

                    이제 서버는 세 경우(없는 이메일·소셜·LOCAL)에 모두 같은 200 을 준다.
                    그래서 여기서 갈래를 만들 근거 자체가 없다 — 누구나 인증코드 칸으로 간다.

                    ⚠️ **친절이 사라진 것이 아니라 옮겨 갔다.** 소셜로 가입한 사람에게는
                       「카카오로 가입되어 있어요」가 **메일로** 간다. 그 메일함을 여는 사람은
                       그 이메일의 주인뿐이라, 알아야 할 사람에게만 닿는다.

                    ⚠️ 잃는 것도 있다 — 이메일에 오타를 낸 사람이 인증코드 칸에서 오지 않는
                       메일을 기다린다. StepHeader 의 「메일이 오지 않으면 가입 방법이 다를
                       수 있어요」가 그 사람을 위한 최소한의 안내다. */}
                <Button
                  size="md"
                  className="bg-primary-600 w-full cursor-pointer text-sm text-white"
                  type="submit"
                >
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
