'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { AdminWithdrawal } from '../../types/adminApi'
import { WITHDRAWAL_REASON_EN_TO_KO } from '../../configs/withdrawalTableConfig'
import { restoreWithdrawnUser } from '@/lib/api/admin'
import Field from '../common/Field'
import { formatDate } from '../common/formatDate'

interface WithdrawalDetailModalProps {
  isOpen: boolean
  withdrawal: AdminWithdrawal | null
  onClose: () => void
}

const ROLE_EN_TO_KO: Record<string, string> = { USER: '일반회원', ADMIN: '관리자' }

function RestoreConfirmDialog({
  isOpen,
  userName,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  userName: string
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = confirmRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={confirmRef}
      className="m-auto w-full max-w-fit flex-col gap-4 rounded-xl bg-white p-6 shadow-2xl backdrop:bg-gray-900/50 open:flex"
      onClick={(e) => {
        if (e.target === confirmRef.current) onCancel()
      }}
      onClose={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <h4 className="text-lg font-semibold text-gray-900">탈퇴 회원 복구</h4>
      <p className="text-sm leading-relaxed text-gray-500">
        <strong>{userName}</strong> 님의 탈퇴를 복구하시겠습니까? 계정이 다시 활성화됩니다.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '처리중...' : '복구'}
        </button>
      </div>
    </dialog>
  )
}

export default function WithdrawalDetailModal({ isOpen, withdrawal, onClose }: WithdrawalDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && withdrawal && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, withdrawal])

  const handleClose = () => {
    setShowRestoreConfirm(false)
    onClose()
  }

  const handleRestore = async () => {
    if (!withdrawal) return
    setIsRestoring(true)
    try {
      await restoreWithdrawnUser(withdrawal.id)
      alert('탈퇴가 복구되었습니다.')
      await queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      setShowRestoreConfirm(false)
      handleClose()
    } catch {
      alert('복구에 실패했습니다.')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-170 flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70 open:flex"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {withdrawal && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">탈퇴 회원 상세 정보</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Profile */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-500">
                {withdrawal.nickname.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{withdrawal.name}</p>
                <p className="text-sm text-gray-500">{withdrawal.email}</p>
              </div>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="회원 ID" value={String(withdrawal.id)} />
              <Field label="이름" value={withdrawal.name} />
              <Field label="닉네임" value={withdrawal.nickname} />
              <Field label="이메일" value={withdrawal.email} />
              {withdrawal.birthDate && <Field label="생년월일" value={formatDate(withdrawal.birthDate)} />}
              {(withdrawal.addressSido || withdrawal.addressGugun) && (
                <Field label="지역" value={`${withdrawal.addressSido ?? ''} ${withdrawal.addressGugun ?? ''}`.trim()} />
              )}
              <Field label="권한" value={ROLE_EN_TO_KO[withdrawal.role] ?? withdrawal.role} />
              <Field
                label="탈퇴 사유"
                value={WITHDRAWAL_REASON_EN_TO_KO[withdrawal.withdrawalReason] ?? withdrawal.withdrawalReason}
              />
              <Field label="탈퇴 일시" value={formatDate(withdrawal.deletedAt)} />
            </div>

            {/* 탈퇴 상세 사유 (테이블엔 없고 모달에서만 보이는 핵심 정보) */}
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-gray-500">탈퇴 상세 사유</p>
              <div className="min-h-20 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line text-gray-900">
                {withdrawal.withdrawalDetailReason || (
                  <span className="text-gray-400">입력된 상세 사유가 없습니다.</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => setShowRestoreConfirm(true)}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              탈퇴 복구
            </button>
          </div>

          <RestoreConfirmDialog
            isOpen={showRestoreConfirm}
            userName={withdrawal.name}
            isLoading={isRestoring}
            onConfirm={handleRestore}
            onCancel={() => setShowRestoreConfirm(false)}
          />
        </>
      )}
    </dialog>
  )
}
