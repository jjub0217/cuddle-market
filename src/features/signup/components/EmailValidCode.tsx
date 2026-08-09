'use client'

import RequiredLabel from '@/components/commons/RequiredLabel'
import InputField from '@/components/commons/InputField'
import InputWithButton from '@/components/commons/InputWithButton'
import type { SignUpFormValues } from './SignUpForm'
import {
  type UseFormRegister,
  type FieldErrors,
  type Control,
  type UseFormClearErrors,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'
import { checkEmail, checkEmailValidCode, sendEmailValidCode } from '@/lib/api/auth'
import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'

// 이메일 인증 영역. 상태가 셋이다. 앱과 같은 규칙을 쓴다
// (mobile/components/signup/email-verification.tsx).
//
//   ① idle      이메일 칸 + [인증받기]
//   ② sent      이메일 칸(잠김) + [재발송] + 인증코드 칸 + [확인] + 남은 시간
//   ③ verified  이메일 칸(잠김) + ✓ 인증 완료 + [이메일 변경]
//
// 코드를 보낸 뒤부터 이메일 칸을 잠그는 이유:
// 받은 코드는 그때 그 주소의 것이다. 주소를 고칠 수 있으면 「인증한 주소」와
// 「가입하는 주소」가 어긋나고, 서버는 가입 시점에 주소로 인증 기록을 찾으므로
// 가입이 막힌다. 바꾸려면 「이메일 변경」을 거쳐 처음부터 다시 하게 한다.

/** 서버 만료가 5분이다(EmailVerificationServiceImpl의 VERIFICATION_CODE_EXPIRY_MINUTES). */
const CODE_TTL_SECONDS = 300

type Phase = 'idle' | 'sent' | 'verified'

interface EmailValidCodeProps {
  control: Control<SignUpFormValues>
  register: UseFormRegister<SignUpFormValues>
  errors: FieldErrors<SignUpFormValues>
  setValue: UseFormSetValue<SignUpFormValues>
  setIsEmailVerified: (verified: boolean) => void
  setIsEmailCodeVerified: (verified: boolean) => void
  clearErrors: UseFormClearErrors<SignUpFormValues>
}

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function EmailValidCode({
  register,
  errors,
  control,
  setValue,
  setIsEmailVerified,
  setIsEmailCodeVerified,
  clearErrors,
}: EmailValidCodeProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)

  const [emailCheckResult, setEmailCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const [codeCheckResult, setCodeCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const [isEmailChecking, setIsEmailChecking] = useState(false)
  const [isCodeChecking, setIsCodeChecking] = useState(false)

  const email = useWatch({ control, name: 'email' })
  const emailCode = useWatch({ control, name: 'emailCode' })

  /** ①로 되돌린다. 인증 상태·코드·타이머를 한꺼번에 푼다. */
  const resetToIdle = (message: string) => {
    setPhase('idle')
    setSecondsLeft(0)
    setValue('emailCode', '')
    setEmailCheckResult({ status: 'idle', message })
    setCodeCheckResult({ status: 'idle', message: '' })
    setIsEmailVerified(false)
    setIsEmailCodeVerified(false)
  }

  // 남은 시간. 0이 되면 만료된 코드를 계속 넣게 두지 않고 처음으로 돌린다.
  //
  // resetToIdle을 타이머 effect의 의존성에 넣으면 매 렌더마다 타이머가 다시 걸린다.
  // 그렇다고 렌더 중에 ref에 대입하면 React Compiler가 막는다(렌더는 순수해야 한다).
  // 그래서 대입도 effect 안에서 한다.
  const resetRef = useRef(resetToIdle)
  useEffect(() => {
    resetRef.current = resetToIdle
  })

  useEffect(() => {
    if (phase !== 'sent') return

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
  }, [phase])

  const handleEmailVerify = async () => {
    // 인증이 끝난 뒤 재발송하면 서버가 기존 인증 기록을 지워 가입이 막힌다.
    if (phase === 'verified') return

    if (!email || email.trim() === '') {
      setEmailCheckResult({ status: 'error', message: '이메일을 입력해주세요.' })
      setIsEmailVerified(false)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailCheckResult({ status: 'error', message: '올바른 이메일 형식을 입력해주세요.' })
      setIsEmailVerified(false)
      return
    }

    setIsEmailChecking(true)
    try {
      const checkResponse = await checkEmail(email)
      if (!checkResponse.data) {
        setEmailCheckResult({
          status: 'error',
          message: checkResponse.message || '이미 가입된 이메일이에요. 로그인하시거나 다른 이메일을 사용해주세요.',
        })
        setIsEmailVerified(false)
        return
      }

      setIsEmailVerified(true)
      clearErrors('email')

      try {
        await sendEmailValidCode(email)
        setEmailCheckResult({
          status: 'success',
          message: '✓ 인증코드를 발송했어요. 이메일을 확인해주세요.',
        })
        setCodeCheckResult({ status: 'idle', message: '' })
        setValue('emailCode', '')
        setPhase('sent')
        setSecondsLeft(CODE_TTL_SECONDS - 1) // 화면에 4:59부터 보이게 한다
      } catch (error) {
        if (isAxiosError(error)) {
          setEmailCheckResult({
            status: 'error',
            message: error.response?.data?.message || '인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.',
          })
        } else {
          setEmailCheckResult({ status: 'error', message: '네트워크 오류가 발생했어요.' })
        }
      }
    } catch {
      setEmailCheckResult({ status: 'error', message: '이메일 확인 중 오류가 발생했어요.' })
      setIsEmailVerified(false)
    } finally {
      setIsEmailChecking(false)
    }
  }

  const handleCheckValidCode = async () => {
    setIsCodeChecking(true)
    try {
      await checkEmailValidCode(email, emailCode)
      setCodeCheckResult({ status: 'success', message: '인증이 완료되었습니다.' })
      setIsEmailCodeVerified(true)
      setPhase('verified')
      setSecondsLeft(0)
      clearErrors('emailCode')
    } catch (error) {
      console.error('인증코드 확인 실패:', error)
      if (isAxiosError(error)) {
        setCodeCheckResult({
          status: 'error',
          message: error.response?.data?.message || '인증코드 오류. 인증코드를 다시 받아주세요.',
        })
      } else {
        setCodeCheckResult({ status: 'error', message: '네트워크 오류가 발생했습니다.' })
      }
      setIsEmailCodeVerified(false)
    } finally {
      setIsCodeChecking(false)
    }
  }

  const locked = phase !== 'idle'

  const emailHelperText =
    phase === 'verified'
      ? '✓ 이메일 인증이 완료되었어요.'
      : phase === 'sent'
        ? '메일이 도착하지 않으면 스팸함을 확인하거나 재발송해주세요.'
        : '사용 가능 여부를 확인한 뒤 인증코드를 보내드려요.'

  return (
    <div className="flex flex-col">
      <RequiredLabel htmlFor="signup-email" labelClass="text-sm">
        이메일
      </RequiredLabel>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          {locked ? (
            // 잠긴 동안에는 버튼을 칸 안에서 빼고, 바꾸려면 「이메일 변경」을 거치게 한다.
            <div className="flex items-start gap-4">
              <InputField
                id="signup-email"
                type="email"
                border
                inputClass="py-2 md:py-2.5 bg-gray-50 text-gray-500"
                error={errors.email}
                checkResult={emailCheckResult}
                registration={register('email', authValidationRules.email)}
                readOnly
                className="flex-1"
              />
              {phase === 'sent' ? (
                <button
                  type="button"
                  onClick={handleEmailVerify}
                  disabled={isEmailChecking}
                  className="bg-primary-100 text-primary hover:bg-primary-200 h-10 shrink-0 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 md:h-11"
                >
                  {isEmailChecking ? '확인 중...' : '재발송'}
                </button>
              ) : null}
            </div>
          ) : (
            <InputWithButton
              id="signup-email"
              type="email"
              placeholder="example@gmail.com"
              error={errors.email}
              checkResult={emailCheckResult}
              registration={register('email', authValidationRules.email)}
              buttonText={isEmailChecking ? '확인 중...' : '인증받기'}
              buttonClassName="bg-primary-100 text-primary cursor-pointer font-semibold text-sm"
              onButtonClick={handleEmailVerify}
              buttonDisabled={isEmailChecking}
              autoFocus
            />
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">{emailHelperText}</p>
            {locked ? (
              <button
                type="button"
                onClick={() => resetToIdle('')}
                className="shrink-0 cursor-pointer text-xs text-gray-500 underline"
              >
                이메일 변경
              </button>
            ) : null}
          </div>
        </div>

        {/* 코드를 보내기 전에는 넣을 코드가 없다. 그래서 이때부터 나타난다. */}
        {phase === 'sent' ? (
          <div className="flex flex-col gap-1.5">
            <InputWithButton
              id="signup-email-code"
              type="text"
              placeholder="전송된 코드를 입력해주세요"
              error={errors.emailCode}
              checkResult={codeCheckResult}
              registration={register('emailCode', authValidationRules.emailCode)}
              buttonText={isCodeChecking ? '확인 중...' : '확인'}
              buttonClassName="cursor-pointer bg-gray-100 font-semibold text-gray-900 text-sm"
              onButtonClick={handleCheckValidCode}
              buttonDisabled={isCodeChecking}
            />
            <p className="text-xs text-gray-500">
              남은 시간 {mmss(secondsLeft)} · 이메일로 받은 인증코드를 입력해주세요.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
