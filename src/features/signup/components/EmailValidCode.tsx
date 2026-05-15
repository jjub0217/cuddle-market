'use client'

import RequiredLabel from '@/components/commons/RequiredLabel'
import InputWithButton from '@/components/commons/InputWithButton'
import type { SignUpFormValues } from './SignUpForm'
import { type UseFormRegister, type FieldErrors, type Control, type UseFormClearErrors, useWatch } from 'react-hook-form'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'
import { checkEmail, checkEmailValidCode, sendEmailValidCode } from '@/lib/api/auth'
import { isAxiosError } from 'axios'
import { useState } from 'react'

interface EmailValidCodeProps {
  control: Control<SignUpFormValues>
  register: UseFormRegister<SignUpFormValues>
  errors: FieldErrors<SignUpFormValues>
  setIsEmailVerified: (verified: boolean) => void
  setIsEmailCodeVerified: (verified: boolean) => void
  clearErrors: UseFormClearErrors<SignUpFormValues>
}

export function EmailValidCode({
  register,
  errors,
  control,
  setIsEmailVerified,
  setIsEmailCodeVerified,
  clearErrors,
}: EmailValidCodeProps) {
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

  const handleEmailVerify = async () => {
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
      setCodeCheckResult({
        status: 'success',
        message: '인증이 완료되었습니다.',
      })
      setIsEmailCodeVerified(true)
      clearErrors('emailCode')
    } catch (error) {
      console.error('인증코드 확인 실패:', error)
      if (isAxiosError(error)) {
        setCodeCheckResult({
          status: 'error',
          message: error.response?.data?.message || '인증코드 오류. 인증코드를 다시 받아주세요.',
        })
      } else {
        setCodeCheckResult({
          status: 'error',
          message: '네트워크 오류가 발생했습니다.',
        })
      }
      setIsEmailCodeVerified(false)
    } finally {
      setIsCodeChecking(false)
    }
  }

  const isCodeSent = emailCheckResult.status === 'success'
  const isCodeVerified = codeCheckResult.status === 'success'

  const emailHelperText = isCodeVerified
    ? '✓ 이메일 인증이 완료되었어요.'
    : isCodeSent
      ? '메일이 도착하지 않으면 스팸함을 확인하거나 재발송해주세요.'
      : '사용 가능 여부를 확인한 뒤 인증코드를 보내드려요.'
  const codeHelperText = isCodeVerified
    ? '✓ 이메일 인증이 완료되었어요.'
    : isCodeSent
      ? '이메일로 받은 인증코드를 입력해주세요.'
      : '이메일 인증 후 인증코드가 발송돼요.'

  return (
    <div className="flex flex-col">
      <RequiredLabel htmlFor="signup-email" labelClass="text-sm">
        이메일
      </RequiredLabel>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <InputWithButton
            id="signup-email"
            type="email"
            placeholder="example@gmail.com"
            error={errors.email}
            checkResult={emailCheckResult}
            registration={register('email', authValidationRules.email)}
            buttonText={isEmailChecking ? '확인 중...' : isCodeSent ? '재발송' : '이메일 인증'}
            buttonClassName="bg-primary-100 text-primary cursor-pointer font-semibold text-sm"
            onButtonClick={handleEmailVerify}
            buttonDisabled={isEmailChecking || isCodeVerified}
            autoFocus
          />
          <p className="text-xs text-gray-500">{emailHelperText}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <InputWithButton
            id="signup-email-code"
            type="text"
            placeholder="전송된 코드를 입력해주세요"
            error={errors.emailCode}
            checkResult={codeCheckResult}
            registration={register('emailCode', authValidationRules.emailCode)}
            buttonText={isCodeChecking ? '확인 중...' : '인증코드 확인'}
            buttonClassName="cursor-pointer bg-gray-100 font-semibold text-gray-900 text-sm"
            onButtonClick={handleCheckValidCode}
            buttonDisabled={isCodeChecking || !isCodeSent || isCodeVerified}
          />
          <p className="text-xs text-gray-500">{codeHelperText}</p>
        </div>
      </div>
    </div>
  )
}
