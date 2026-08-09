import { useEffect, useRef } from 'react'
import Button from '../commons/button/Button'
import ModalTitle from './ModalTitle'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '../commons/InlineNotification'

interface DeletePostConfirmProps {
  isOpen: boolean
  postId: number | null
  onConfirm: (id: number) => void
  onCancel: () => void
  error?: React.ReactNode
  onClearError?: () => void
}

export default function DeletePostConfirmModal({
  isOpen,
  postId,
  onConfirm,
  onCancel,
  error,
  onClearError,
}: DeletePostConfirmProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && postId && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, postId])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-post-modal-title"
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-96"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={onCancel}
    >
      {postId ? (
        <>
          <ModalTitle headingId="delete-post-modal-title" heading="게시글 삭제" description="정말로 이 게시글을 삭제하시겠습니까?" />
          <AnimatePresence>
            {error ? (
              <InlineNotification type="error" onClose={() => onClearError?.()}>
                {error}
              </InlineNotification>
            ) : null}
          </AnimatePresence>
          <div className="flex justify-end gap-3">
            <Button onClick={() => dialogRef.current?.close()} size="md" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
              취소
            </Button>
            <Button onClick={() => onConfirm(postId)} size="md" className="bg-danger-600 cursor-pointer rounded-lg text-white">
              삭제하기
            </Button>
          </div>
        </>
      ) : null}
    </dialog>
  )
}
