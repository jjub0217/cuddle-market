'use client'

import { PASSWORD_UPDATE_ALERT_LIST } from '@/constants/constants'
import { useForm, useWatch } from 'react-hook-form'
import { profileValidationRules } from '@/lib/utils/validation/authValidationRules'
import Button from '@/components/commons/button/Button'
import { CircleAlert } from 'lucide-react'
import InputField from '@/components/commons/InputField'
import AlertBox from '@/components/modal/AlertBox'
import { useEffect, useState } from 'react'
import { changePassword } from '@/lib/api/profile'
import InlineNotification from '@/components/commons/InlineNotification'
import { AnimatePresence } from 'framer-motion'

export interface ProfileUpdatePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfileUpdatePasswordForm() {
  const {
    handleSubmit,
    register,
    control,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdatePasswordFormValues>({
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const [pwUpdateError, setPwUpdateError] = useState<React.ReactNode | null>(null)
  const [pwUpdateSuccess, setPwUpdateSuccess] = useState<React.ReactNode | null>(null)
  const [pwUpdateWarning, setPwUpdateWarning] = useState<React.ReactNode | null>(null)

  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const password = useWatch({ control, name: 'newPassword' })
  const passwordConfirm = useWatch({ control, name: 'confirmPassword' })

  const onSubmit = async (requestData: ProfileUpdatePasswordFormValues) => {
    if (requestData.currentPassword === requestData.newPassword) {
      setPwUpdateWarning(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">동일한 비밀번호입니다.</p>
          <p>현재 비밀번호와 다른 비밀번호를 입력해주세요.</p>
        </div>
      )
      return
    }

    try {
      await changePassword({ ...requestData })
      reset()
      setPwUpdateSuccess(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">성공적으로 비밀번호를 변경했습니다.</p>
          <p>변경사항이 성공적으로 적용되었습니다.</p>
        </div>
      )
    } catch {
      setPwUpdateError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">비밀번호 변경에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  useEffect(() => {
    if (passwordConfirm && password) {
      if (password === passwordConfirm) {
        setCheckResult({
          status: 'success',
          message: '비밀번호가 일치합니다.',
        })
        clearErrors('confirmPassword')
      } else {
        setCheckResult({
          status: 'idle',
          message: '',
        })
        setError('confirmPassword', {
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
    <form className="flex w-full flex-col gap-6 rounded-xl border border-gray-200 bg-white p-7" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="flex flex-col gap-8">
        <legend className="sr-only">비밀번호 변경 폼</legend>
        <div className="flex flex-col gap-2">
          <h2 className="heading-h3">비밀번호 변경</h2>
          <p className="text-gray-500">보안을 위해 주기적으로 비밀번호를 변경해주세요</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-600">현재 비밀번호</span>
                <InputField
                  id="current-password"
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  size="text-sm"
                  border
                  borderColor="border-gray-400"
                  error={errors.currentPassword}
                  registration={register('currentPassword', profileValidationRules.currentPassword)}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-600">새 비밀번호</span>
                <InputField
                  id="new-password"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  size="text-sm"
                  border
                  borderColor="border-gray-400"
                  error={errors.newPassword}
                  registration={register('newPassword', profileValidationRules.newPassword)}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-600">새 비밀번호 확인</span>
                <InputField
                  id="confirm-password"
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  size="text-sm"
                  border
                  borderColor="border-gray-400"
                  error={errors.confirmPassword}
                  checkResult={checkResult}
                  registration={register('confirmPassword', profileValidationRules.confirmPassword(password))}
                />
              </div>
            </div>
            <AlertBox
              alertList={PASSWORD_UPDATE_ALERT_LIST}
              iconColor="text-blue-800"
              bgColor="bg-blue-100/30"
              borderColor="border-blue-100"
              title="안전한 비밀번호 만들기"
              titleColor="text-[#155DFC]"
              icon={CircleAlert}
              listColor="text-[#155DFC]"
            />
          </div>
          <AnimatePresence>
            {pwUpdateError && (
              <InlineNotification type="error" onClose={() => setPwUpdateError(null)}>
                {pwUpdateError}
              </InlineNotification>
            )}
            {pwUpdateSuccess && (
              <InlineNotification type="success" onClose={() => setPwUpdateSuccess(null)}>
                {pwUpdateSuccess}
              </InlineNotification>
            )}
            {pwUpdateWarning && (
              <InlineNotification type="warning" onClose={() => setPwUpdateWarning(null)}>
                {pwUpdateWarning}
              </InlineNotification>
            )}
          </AnimatePresence>
          <Button size="md" className="bg-primary-300 w-full cursor-pointer text-white" type="submit">
            비밀번호 변경
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
