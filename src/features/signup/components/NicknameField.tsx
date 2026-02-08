'use client'

import RequiredLabel from '@/components/commons/RequiredLabel'
import InputWithButton from '@/components/commons/InputWithButton'
import {
  type FieldError,
  type FieldValues,
  type Path,
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  type UseFormClearErrors,
} from 'react-hook-form'
import { signupValidationRules } from '../validationRules'
import { checkNickname } from '@/lib/api/auth'
import { isAxiosError } from 'axios'
import { useEffect } from 'react'

interface NicknameFieldProps<T extends FieldValues> {
  watch: UseFormWatch<T>
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  setIsNicknameVerified: (verified: boolean) => void
  clearErrors: UseFormClearErrors<T>
  setCheckResult: (result: { status: 'idle' | 'success' | 'error'; message: string }) => void
  checkResult: { status: 'idle' | 'success' | 'error'; message: string }
}

export function NicknameField<T extends FieldValues>({
  register,
  errors,
  watch,
  setIsNicknameVerified,
  clearErrors,
  setCheckResult,
  checkResult,
}: NicknameFieldProps<T>) {
  const nickname = watch('nickname' as Path<T>)

  const handleNicknameCheck = async () => {
    try {
      const response = await checkNickname(nickname)

      if (response.data) {
        setCheckResult({
          status: 'success',
          message: response.message,
        })
        setIsNicknameVerified(true)
        clearErrors('nickname' as Path<T>)
      } else {
        setCheckResult({
          status: 'error',
          message: response.message,
        })
        setIsNicknameVerified(false)
      }
    } catch (error) {
      console.error('닉네임 확인 실패:', error)
      if (isAxiosError(error)) {
        setCheckResult({
          status: 'error',
          message: error.response?.data?.message || '닉네임 확인 중 오류가 발생했습니다.',
        })
      } else {
        setCheckResult({
          status: 'error',
          message: '네트워크 오류가 발생했습니다.',
        })
      }
      setIsNicknameVerified(false)
    }
  }

  useEffect(() => {
    setCheckResult({ status: 'idle', message: '' })
    setIsNicknameVerified(false)
  }, [nickname, setIsNicknameVerified, setCheckResult])

  return (
    <div className="flex flex-col gap-2.5">
      <RequiredLabel htmlFor="signup-nickname">닉네임</RequiredLabel>
      <InputWithButton
        id="signup-nickname"
        type="text"
        placeholder="닉네임을 입력해주세요"
        error={errors.nickname as FieldError | undefined}
        checkResult={checkResult}
        registration={register('nickname' as Path<T>, signupValidationRules.nickname)}
        buttonText="중복체크"
        onButtonClick={handleNicknameCheck}
      />
    </div>
  )
}
