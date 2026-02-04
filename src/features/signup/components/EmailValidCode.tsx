'use client'

import { RequiredLabel } from '@/components/commons/RequiredLabel'
import { InputWithButton } from '@/components/commons/InputWithButton'
import type { SignUpFormValues } from './SignUpForm'
import { type UseFormRegister, type FieldErrors, type UseFormWatch, type UseFormClearErrors } from 'react-hook-form'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'
import { checkEmail, checkEmailValidCode, sendEmailValidCode } from '@/lib/api/auth'
import { useState } from 'react'

interface EmailValidCodeProps {
  watch: UseFormWatch<SignUpFormValues>
  register: UseFormRegister<SignUpFormValues>
  errors: FieldErrors<SignUpFormValues>
  setIsEmailVerified: (verified: boolean) => void
  setIsEmailCodeVerified: (verified: boolean) => void
  clearErrors: UseFormClearErrors<SignUpFormValues>
}

export function EmailValidCode({ register, errors, watch, setIsEmailVerified, setIsEmailCodeVerified, clearErrors }: EmailValidCodeProps) {
  const [emailCheckResult, setEmailCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const [codeCheckResult, setCodeCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const email = watch('email')
  const emailCode = watch('emailCode')

  const handleEmailCheck = async () => {
    try {
      const response = await checkEmail(email)

      if (response.data) {
        // 사용 가능 (data: true)
        setEmailCheckResult({
          status: 'success',
          message: response.message, // "사용 가능한 이메일입니다."
        })
        setIsEmailVerified(true)
        clearErrors('email')
      } else {
        // 중복 (data: false)
        setEmailCheckResult({
          status: 'error',
          message: response.message, // "이미 사용 중인 이메일입니다."
        })
        setIsEmailVerified(false)
      }
    } catch {
      setEmailCheckResult({
        status: 'error',
        message: '이메일 확인 중 오류가 발생했습니다.',
      })
      setIsEmailVerified(false)
    }
  }

  const handleSendVaildCode = async () => {
    try {
      await sendEmailValidCode(email)
      setEmailCheckResult({
        status: 'success',
        message: '인증 번호를 발송했습니다.',
      })
    } catch {
      setEmailCheckResult({
        status: 'error',
        message: '인증코드 오류. 인증코드를 다시 받아주세요.',
      })
    }
  }

  const handleCheckValidCode = async () => {
    try {
      await checkEmailValidCode(email, emailCode)
      setCodeCheckResult({
        status: 'success',
        message: '인증이 완료되었습니다.',
      })
      setIsEmailCodeVerified(true)
      clearErrors('emailCode')
    } catch {
      setCodeCheckResult({
        status: 'error',
        message: '인증코드 오류. 인증코드를 다시 받아주세요.',
      })
      setIsEmailCodeVerified(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <RequiredLabel htmlFor="signup-email">이메일</RequiredLabel>
      <div className="flex flex-col gap-4">
        <InputWithButton
          id="signup-email"
          type="email"
          placeholder="example@gmail.com"
          error={errors.email}
          checkResult={emailCheckResult}
          registration={register('email', authValidationRules.email)}
          buttonText={emailCheckResult.status === 'success' ? '인증코드 전송' : '중복체크'}
          onButtonClick={emailCheckResult.status === 'success' ? handleSendVaildCode : handleEmailCheck}
        />
        <InputWithButton
          id="signup-email-code"
          type="text"
          placeholder="전송된 코드를 입력해주세요"
          error={errors.emailCode}
          checkResult={codeCheckResult}
          registration={register('emailCode', authValidationRules.emailCode)}
          buttonText="인증코드 확인"
          buttonClassName="cursor-pointer bg-gray-100 font-semibold text-gray-900"
          onButtonClick={handleCheckValidCode}
        />
      </div>
    </div>
  )
}
