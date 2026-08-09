'use client'

import InputField from '@/components/commons/InputField'
import RequiredLabel from '@/components/commons/RequiredLabel'
import type { SignUpFormValues } from './SignUpForm'
import {
  type UseFormRegister,
  type FieldErrors,
  type Control,
  type UseFormSetError,
  type UseFormClearErrors,
  useWatch,
} from 'react-hook-form'
import { authValidationRules, PASSWORD_MAX, passwordRules } from '@/lib/utils/validation/authValidationRules'
import { signupValidationRules } from '../validationRules'
import { PasswordChecklist } from './PasswordChecklist'
import { useMemo, useEffect } from 'react'

interface PasswordFieldProps {
  register: UseFormRegister<SignUpFormValues>
  errors: FieldErrors<SignUpFormValues>
  control: Control<SignUpFormValues>
  setError: UseFormSetError<SignUpFormValues>
  clearErrors: UseFormClearErrors<SignUpFormValues>
}

export function PasswordField({ register, errors, control, setError, clearErrors }: PasswordFieldProps) {
  const password = useWatch({ control, name: 'password' })
  const passwordConfirm = useWatch({ control, name: 'passwordConfirm' })

  const passwordChecks = useMemo(() => passwordRules(password ?? ''), [password])

  const checkResult = useMemo(() => {
    if (passwordConfirm && password && password === passwordConfirm) {
      return { status: 'success' as const, message: '비밀번호가 일치합니다.' }
    }
    return { status: 'idle' as const, message: '' }
  }, [password, passwordConfirm])

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
    <div className="flex flex-col">
      <RequiredLabel htmlFor="signup-password" labelClass="text-sm">
        비밀번호
      </RequiredLabel>
      {/* 비밀번호와 그 조건 목록은 한 덩어리로 붙이고(gap-1),
          다음 칸과는 다른 항목만큼 띄운다(gap-4). 안 띄우면 조건 목록이
          아래 칸에 딸린 문구처럼 보인다. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <InputField
            id="signup-password"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            border
            maxLength={PASSWORD_MAX}
            registration={register('password', authValidationRules.password)}
          />
          {/* 오류 문구(errors.password)를 함께 넘기지 않는다 — 체크리스트가 같은 내용을
              더 자세히 보여주므로 두 줄이 겹쳐 나온다. */}
          <PasswordChecklist
            checks={passwordChecks}
            visible={Boolean(password) || Boolean(errors.password)}
          />
        </div>
        <InputField
          id="signup-password-confirm"
          type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          border
          error={errors.passwordConfirm}
          checkResult={checkResult}
          maxLength={PASSWORD_MAX}
          registration={register('passwordConfirm', signupValidationRules.passwordConfirm(password))}
        />
      </div>
    </div>
  )
}
