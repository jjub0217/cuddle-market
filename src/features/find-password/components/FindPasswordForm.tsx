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

/**
 * 막다른 길 안내 문구. 앱과 같은 말을 쓴다(mobile/app/find-password.tsx 의 blockedText).
 *
 * **「비밀번호 대신」이 핵심이다.** 여기 온 사람은 「비밀번호를 찾으러」 왔으므로,
 * 「그럼 내 비밀번호는?」에 답이 있어야 발길을 돌린다. 「재설정이 불가능합니다」는 그 답이 없다.
 *
 * 어느 소셜인지 알면 콕 집어 말한다. 모를 때만 「카카오 또는 구글」로 벌려 쓴다 —
 * 「카카오·구글로 가입한」은 **둘 다로 가입한 것처럼** 읽힌다.
 */
function blockedText(blocked: 'kakao' | 'google' | 'social' | 'notFound'): string {
  if (blocked === 'notFound') {
    return '가입된 계정을 찾지 못했어요.\n이메일을 다시 확인해주세요.'
  }
  if (blocked === 'social') {
    return '카카오 또는 구글로 가입한 계정이에요.\n비밀번호 대신 그 방법으로 로그인해주세요.'
  }
  const name = blocked === 'kakao' ? '카카오' : '구글'
  return `${name}로 가입한 계정이에요.\n비밀번호 대신 ${name} 로그인을 이용해주세요.`
}

/** 서버 만료가 5분이다(EmailVerificationServiceImpl 의 VERIFICATION_CODE_EXPIRY_MINUTES). */
const CODE_TTL_SECONDS = 300

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// 이 화면의 칸과 단추는 **높이를 48(h-12)로 못 박는다.**
//
// 공용 조각이 저마다 다른 높이를 갖고 있어 한 화면에 셋이 섞여 있었다(2026-08-05 실측):
//   이메일 칸 46 · 인증코드 전송 40 · 인증코드 칸 46 · 재전송 44 · 이메일 변경 40 · 인증하기 40
// 특히 나란히 붙은 인증코드 칸(46)과 재전송(44)의 2px 이 제일 눈에 띄었다.
//
// ⚠️ 공용 조각(Button·Input)을 고치지 않는다 — 웹 전체 화면이 함께 바뀐다.
//    웹 전체의 높이 통일은 따로 다룬다.
// cn 이 tailwind-merge 라서 나중에 준 h-12 가 확실히 이긴다.
//
// 앱도 같은 48이다(mobile 의 field.tsx · fieldStyles.button · submit).

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
   * ⚠️ sendValidCodeResult 에 얹지 않는다 — 그 값은 「막다른 길」을 가리는 데 쓰여서
   *    (blocked), 만료 문구를 넣으면 「가입된 계정을 찾지 못했어요」 박스가 뜬다.
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

  // ⚠️ 옛 문구(「소셜 로그인 사용자는…」)도 함께 알아본다. 백엔드와 웹은 따로 배포되므로
  //    그 사이에는 서버가 옛 문구를 준다. 안 받아주면 그동안 「가입 이력이 없는 이메일」로
  //    잘못 안내하게 된다 — 없는 것보다 나쁜 안내다.
  const blocked: 'kakao' | 'google' | 'social' | 'notFound' | null = !(
    sendValidCodeResult.status === 'error' && resultIsCurrent
  )
    ? null
    : sendValidCodeResult.message.includes('카카오')
      ? 'kakao'
      : sendValidCodeResult.message.includes('구글')
        ? 'google'
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
                      size="text-sm"
                      border
                      borderColor="border-gray-400"
                    // 이 화면의 칸·단추 높이를 48로 맞춘다(아래 주석 참고)
                    wrapperClassName="h-12"
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
                    // 이 화면의 칸·단추 높이를 48로 맞춘다(아래 주석 참고)
                    wrapperClassName="h-12"
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
                  className="h-12 w-full cursor-pointer bg-[#22C55E] text-white"
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
                    wrapperClassName="h-12"
                    buttonClassName="h-12 md:h-12"
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
                    className="h-12 w-full cursor-pointer border border-gray-400 bg-white text-gray-900"
                    type="button"
                    onClick={handlePreviousStep}
                  >
                    이메일 변경
                  </Button>
                  <Button
                    size="md"
                    className="bg-primary-600 h-12 w-full cursor-pointer text-white"
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
                    size="text-sm"
                    error={errors.email}
                    border
                    borderColor="border-gray-400"
                    // 이 화면의 칸·단추 높이를 48로 맞춘다(아래 주석 참고)
                    wrapperClassName="h-12"
                    // 막다른 길(소셜·없는 이메일)은 아래 박스가 말한다. 여기까지 띄우면
                    // 같은 말이 두 줄로 겹친다. 그 밖의 실패(네트워크 등)만 칸 아래에 남긴다.
                    checkResult={
                      expiredNotice
                        ? { status: 'error', message: expiredNotice }
                        : sendValidCodeResult.status === 'error' && resultIsCurrent && blocked === null
                          ? sendValidCodeResult
                          : undefined
                    }
                    registration={register('email', authValidationRules.email)}
                  />
                </div>
                {/* 서버가 막았을 때 「안 된다」로 끝내지 않고 갈 길을 준다.
                    여기 온 사람은 대개 카카오·구글로 가입한 걸 잊고 이메일 로그인을 하려다 온 사람이다.
                    앱도 같은 안내를 한다(#838). */}
                {/* 막다른 길이면 **그 길만 남긴다.**
                    ① 「인증코드 전송」을 숨긴다 — 방금 서버가 「안 된다」고 답한 행동이다.
                       가장 진한 단추가 눌러도 같은 오류가 나는 단추이면 위계가 거꾸로다.
                       흐리게(disabled) 두는 대신 숨기는 이유: 흐린 단추는 「왜 안 되지?」를
                       만들지만, 숨기면 그 질문이 안 생긴다. 이유는 바로 위 박스가 말한다.
                    ② 「로그인으로 돌아가기」도 숨긴다 — 박스 단추와 **가는 곳이 같다.**
                       한 화면에 목적지가 같은 길이 둘이면 「뭐가 다르지?」를 생각하게 만든다.
                    이메일 칸은 남긴다. 오타였을 수 있고, 고치면 이 박스가 사라지며
                    아래 단추들이 돌아온다(resultIsCurrent). */}
                {blocked ? (
                  <div className="bg-surface-container-low flex flex-col gap-3 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-line text-gray-700">{blockedText(blocked)}</p>
                    <Link
                      href={blocked === 'notFound' ? ROUTES.SIGNUP : ROUTES.LOGIN}
                      className="bg-primary-600 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      {blocked === 'notFound' ? '회원가입하러 가기' : '로그인하러 가기'}
                    </Link>
                  </div>
                ) : (
                  <>
                    <Button
                      size="md"
                      className="bg-primary-600 h-12 w-full cursor-pointer text-sm text-white"
                      type="submit"
                    >
                      인증코드 전송
                    </Button>
                    <Link href={ROUTES.LOGIN} className="text-primary w-full text-center text-sm font-medium">
                      로그인으로 돌아가기
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </fieldset>
    </form>
  )
}
