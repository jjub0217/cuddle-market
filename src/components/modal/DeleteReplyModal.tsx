import Button from '../commons/button/Button'
import ModalTitle from './ModalTitle'
import { useRef, useState } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { Z_INDEX } from '@/constants/ui'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '../commons/InlineNotification'

interface DeleteReplyModalProps {
  isOpen: boolean
  replyId: number
  onCancel: () => void
  onConfirm: (id: number) => Promise<void>
}

export default function DeleteReplyModal({ isOpen, onCancel, replyId, onConfirm }: DeleteReplyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [replyDeleteError, setReplyDeleteError] = useState<React.ReactNode | null>(null)
  useOutsideClick(isOpen, [modalRef], onCancel)

  const handleConfirm = async () => {
    try {
      await onConfirm(replyId)
      onCancel()
    } catch {
      setReplyDeleteError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">댓글 삭제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>,
      )
    }
  }

  if (!isOpen || !replyId) return null

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-gray-900/70 ${Z_INDEX.MODAL}`}>
      <div ref={modalRef} className="flex w-11/12 flex-col gap-4 rounded-lg bg-white p-5 md:w-[16vw] md:min-w-max">
        <ModalTitle heading="댓글 삭제하기" description="정말로 이 댓글을 삭제하시겠습니까?" />
        <AnimatePresence>
          {replyDeleteError && (
            <InlineNotification type="error" onClose={() => setReplyDeleteError(null)}>
              {replyDeleteError}
            </InlineNotification>
          )}
        </AnimatePresence>
        <div className="flex justify-end gap-3">
          <Button type="button" onClick={onCancel} size="sm" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
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
      </div>
    </div>
  )
}
