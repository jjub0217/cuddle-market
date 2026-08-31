'use client'

import { useEffect, useRef } from 'react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  /** 처리 중이면 단추를 잠가 연타를 막는다. 안 넘기면 예전과 똑같이 동작한다. */
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = '삭제',
  isPending = false,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
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
        // 처리 중에는 바깥을 눌러도 안 닫는다 — 닫히면 결과를 못 알린다
        if (e.target === confirmRef.current && !isPending) onCancel()
      }}
      onClose={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? '처리 중...' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
