'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { MockUser } from '../../mocks/mockUsers'

interface UserDetailModalProps {
  isOpen: boolean
  user: MockUser | null
  onClose: () => void
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900">
        {value}
      </div>
    </div>
  )
}

function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
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
      className="m-auto w-full max-w-fit open:flex flex-col gap-4 rounded-xl bg-white p-6 shadow-2xl backdrop:bg-gray-900/50"
      onClick={(e) => {
        if (e.target === confirmRef.current) onCancel()
      }}
      onClose={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <h4 className="text-lg font-semibold text-gray-900">회원 삭제 확인</h4>
      <p className="text-sm leading-relaxed text-gray-500">
        삭제 시 해당 유저와 관련된 모든 데이터가 즉시 삭제되며 되돌릴 수 없습니다.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          삭제
        </button>
      </div>
    </dialog>
  )
}

export default function UserDetailModal({ isOpen, user, onClose }: UserDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && user && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, user])

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-[680px] open:flex flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {user && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">회원 상세 정보</h3>
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
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.nickname}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-500">
                  {user.nickname.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="회원 ID" value={String(user.id)} />
              <Field label="이름" value={user.name} />
              <Field label="닉네임" value={user.nickname} />
              <Field label="이메일" value={user.email} />
              <Field label="생년월일" value={formatDate(user.birthDate)} />
              <Field label="지역" value={`${user.addressSido} ${user.addressGugun}`} />
              <Field label="권한" value={user.role} />
              <Field label="상태" value={user.status} />
              <Field label="회원가입 일시" value={formatDateTime(user.joinedAt)} />
              {user.withdrawalRequestedAt && (
                <Field label="탈퇴요청 일시" value={formatDateTime(user.withdrawalRequestedAt)} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              수정하기
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              삭제하기
            </button>
          </div>

          <DeleteConfirmDialog
            isOpen={showDeleteConfirm}
            onConfirm={() => {
              setShowDeleteConfirm(false)
              dialogRef.current?.close()
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </>
      )}
    </dialog>
  )
}
