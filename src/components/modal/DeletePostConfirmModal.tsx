import { useRef } from 'react'
import Button from '../commons/button/Button'
import ModalTitle from './ModalTitle'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { Z_INDEX } from '@/constants/ui'
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

export default function DeletePostConfirmModal({ isOpen, postId, onConfirm, onCancel, error, onClearError }: DeletePostConfirmProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isOpen, [modalRef], onCancel)
  if (!isOpen || !postId) return null

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-gray-900/70 ${Z_INDEX.MODAL}`}>
      <div className="flex w-11/12 flex-col gap-4 rounded-lg bg-white p-5 md:w-[16vw] md:min-w-96" ref={modalRef}>
        <ModalTitle heading="게시글 삭제" description="정말로 이 게시글을 삭제하시겠습니까?" />
        <AnimatePresence>
          {error && (
            <InlineNotification type="error" onClose={() => onClearError?.()}>
              {error}
            </InlineNotification>
          )}
        </AnimatePresence>
        <div className="flex justify-end gap-3">
          <Button onClick={onCancel} size="sm" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
            취소
          </Button>
          <Button onClick={() => onConfirm(postId)} size="sm" className="bg-danger-600 cursor-pointer rounded-lg text-white">
            삭제하기
          </Button>
        </div>
      </div>
    </div>
  )
}
