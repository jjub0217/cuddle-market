import Button from '../commons/button/Button'
import { WITH_DRAW_ALERT_LIST, WiTH_DRAW_REASON } from '@/constants/constants'
import { Controller, useForm, useWatch } from 'react-hook-form'
import SelectDropdown from '../commons/select/SelectDropdown'
import RequiredLabel from '../commons/RequiredLabel'
import { WithDrawApiErrors } from '@/constants/validationRules'
import AlertBox from './AlertBox'
import ModalTitle from './ModalTitle'
import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '../commons/InlineNotification'

export interface WithDrawFormValues {
  reason: string
  detailReason: string
  agree: boolean
}

interface WithdrawModalProps {
  isOpen: boolean
  onConfirm: (data: WithDrawFormValues) => void
  onCancel: () => void
  error?: React.ReactNode
  onClearError?: () => void
}

export default function WithdrawModal({ isOpen, onConfirm, onCancel, error, onClearError }: WithdrawModalProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isValid },
  } = useForm<WithDrawFormValues>({
    mode: 'onChange',
    defaultValues: {
      reason: '서비스 불만족',
      detailReason: '',
      agree: false,
    },
  })
  const detailReason = useWatch({ control, name: 'detailReason' })
  const titleLength = detailReason?.length ?? 0
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  const onSubmit = (data: WithDrawFormValues) => {
    const koToEn = WiTH_DRAW_REASON.find((status) => status.label === data.reason)?.id ?? data.reason
    onConfirm({ ...data, reason: koToEn })
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-96"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={() => {
        reset()
        onCancel()
      }}
    >
      <ModalTitle heading="회원탈퇴" description="정말로 탈퇴하시겠습니까?" />
      <AnimatePresence>
        {error && (
          <InlineNotification type="error" onClose={() => onClearError?.()}>
            {error}
          </InlineNotification>
        )}
      </AnimatePresence>
      <AlertBox alertList={WITH_DRAW_ALERT_LIST} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-1">
            <RequiredLabel htmlFor="withdrawReason" labelClass="font-semibold">
              탈퇴 사유
            </RequiredLabel>
            <Controller
              name="reason"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={WiTH_DRAW_REASON.map((sort) => ({
                    value: sort.label,
                    label: sort.label,
                  }))}
                  buttonClassName="border-0 bg-primary-50 text-gray-900 px-3 py-3"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <RequiredLabel htmlFor="withdrawReasonDetail" labelClass="font-semibold">
              탈퇴 상세 사유
            </RequiredLabel>
            <div className="flex flex-col gap-0.5">
              <textarea
                placeholder="탈퇴 사유를 입력해주세요."
                className="bg-primary-50 focus:border-primary-500 w-full resize-none rounded-lg px-3 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
                id="withdrawReasonDetail"
                {...register('detailReason', {
                  required: WithDrawApiErrors.detailReason.required,
                  minLength: WithDrawApiErrors.detailReason.minLength,
                  maxLength: WithDrawApiErrors.detailReason.maxLength,
                })}
              />
              <p className="text-sm font-semibold text-gray-400">{titleLength}/500자</p>
              {errors.detailReason && <p className="text-danger-500 text-xs font-semibold"> {errors.detailReason.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input id="withdrawAgree" type="checkbox" className="h-4 w-4" {...register('agree', { required: true })} />
            <RequiredLabel htmlFor="withdrawAgree" labelClass="text-sm font-semibold">
              회원 탈퇴에 동의합니다.
            </RequiredLabel>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" onClick={() => dialogRef.current?.close()} size="sm" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
            취소
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            size="sm"
            className="bg-danger-600 cursor-pointer rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            탈퇴하기
          </Button>
        </div>
      </form>
    </dialog>
  )
}
