import Button from '../commons/button/Button'
import ModalTitle from './ModalTitle'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '../commons/InlineNotification'

interface DeleteReplyModalProps {
  isOpen: boolean
  replyId: number
  onCancel: () => void
  onConfirm: (id: number) => Promise<void>
}

export default function DeleteReplyModal({ isOpen, onCancel, replyId, onConfirm }: DeleteReplyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [replyDeleteError, setReplyDeleteError] = useState<React.ReactNode | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && replyId && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, replyId])

  const handleConfirm = async () => {
    try {
      await onConfirm(replyId)
      dialogRef.current?.close()
    } catch {
      setReplyDeleteError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">댓글 삭제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>,
      )
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-max"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={onCancel}
    >
      <ModalTitle heading="댓글 삭제하기" description="정말로 이 댓글을 삭제하시겠습니까?" />
      <AnimatePresence>
        {replyDeleteError && (
          <InlineNotification type="error" onClose={() => setReplyDeleteError(null)}>
            {replyDeleteError}
          </InlineNotification>
        )}
      </AnimatePresence>
      <div className="flex justify-end gap-3">
        <Button type="button" onClick={() => dialogRef.current?.close()} size="sm" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
          취소
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          className="bg-danger-600 cursor-pointer rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          삭제하기
        </Button>
      </div>
    </dialog>
  )
}
