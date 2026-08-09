'use client'

import Button from '@/components/commons/button/Button'
import { useEffect, useRef } from 'react'
import type { CommunityPostFormValues } from '@/types/forms'

interface DraftModalProps {
  initialBoardType: string
  showDraftModal: boolean
  setIsDraftChecked: (isDraftChecked: boolean) => void
  setShowDraftModal: (showDraftModal: boolean) => void
  clearDraft: (boardType: string) => void
  getSavedDraft: (boardType: string) => CommunityPostFormValues
  reset: (data: CommunityPostFormValues) => void
}

export default function DraftModal({
  setIsDraftChecked,
  showDraftModal,
  setShowDraftModal,
  clearDraft,
  getSavedDraft,
  reset,
  initialBoardType,
}: DraftModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (showDraftModal && !dialog?.open) {
      dialog?.showModal()
    } else if (!showDraftModal && dialog?.open) {
      dialog?.close()
    }
  }, [showDraftModal])

  const closeAndDiscard = () => {
    clearDraft(initialBoardType)
    setIsDraftChecked(true)
    setShowDraftModal(false)
  }

  const handleLoadDraft = () => {
    const draft = getSavedDraft(initialBoardType)
    reset(draft)
    setIsDraftChecked(true)
    setShowDraftModal(false)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="draft-modal-title"
      className="m-auto w-11/12 open:flex flex-col items-center gap-6 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-80"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={closeAndDiscard}
    >
      <div className="flex w-full flex-col items-center gap-2">
        <h2 id="draft-modal-title" className="heading-h4">
          임시저장된 글이 있습니다
        </h2>
        <p>이어서 작성하시겠습니까?</p>
      </div>
      <div className="flex w-full gap-3">
        <Button type="button" size="md" className="flex-1 cursor-pointer border border-gray-300" onClick={closeAndDiscard}>
          취소
        </Button>
        <Button
          type="button"
          size="md"
          className="bg-primary-600 flex-1 cursor-pointer text-white"
          onClick={handleLoadDraft}
        >
          확인
        </Button>
      </div>
    </dialog>
  )
}
