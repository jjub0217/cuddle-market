'use client'

import InputField from '@/components/commons/InputField'
import RequiredLabel from '@/components/commons/RequiredLabel'
import type { SignUpFormValues } from './SignUpForm'
import { type UseFormRegister, type FieldErrors, type UseFormWatch, type UseFormSetError, type UseFormClearErrors } from 'react-hook-form'
import { authValidationRules } from '@/lib/utils/validation/authValidationRules'
import { signupValidationRules } from '../validationRules'
import { useState, useEffect } from 'react'

interface PasswordFieldProps {
  register: UseFormRegister<SignUpFormValues>
  errors: FieldErrors<SignUpFormValues>
  watch: UseFormWatch<SignUpFormValues>
  setError: UseFormSetError<SignUpFormValues>
  clearErrors: UseFormClearErrors<SignUpFormValues>
}

export function PasswordField({ register, errors, watch, setError, clearErrors }: PasswordFieldProps) {
  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const password = watch('password')
  const passwordConfirm = watch('passwordConfirm')

  useEffect(() => {
    if (passwordConfirm && password) {
      if (password === passwordConfirm) {
        setCheckResult({
          status: 'success',
          message: '비밀번호가 일치합니다.',
        })
        clearErrors('passwordConfirm')
      } else {
        setCheckResult({
          status: 'idle',
          message: '',
        })
        setError('passwordConfirm', {
          type: 'manual',
          message: '비밀번호가 일치하지 않습니다.',
        })
      }
    } else {
      setCheckResult({
        status: 'idle',
        message: '',
      })
    }
  }, [password, passwordConfirm, setError, clearErrors])

  return (
    <div className="flex flex-col gap-2.5">
      <RequiredLabel htmlFor="signup-password">비밀번호</RequiredLabel>
      <div className="flex flex-col gap-4">
        <InputField
          id="signup-password"
          type="password"
          placeholder="비밀번호를 입력해주세요"
          size="text-sm"
          border
          borderColor="border-gray-400"
          error={errors.password}
          registration={register('password', authValidationRules.password)}
        />
        <InputField
          id="signup-password-confirm"
          type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          size="text-sm"
          border
          borderColor="border-gray-400"
          error={errors.passwordConfirm}
          checkResult={checkResult}
          registration={register('passwordConfirm', signupValidationRules.passwordConfirm(watch('password')))}
        />
      </div>
    </div>
  )
}
