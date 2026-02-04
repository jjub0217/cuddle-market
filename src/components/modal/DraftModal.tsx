'use client'

import { Button } from '@/components/commons/button/Button'
import { useRef } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { Z_INDEX } from '@/constants/ui'
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
  const modalRef = useRef<HTMLDivElement>(null)
  // 바깥 클릭 시 모달 닫고 자동저장 시작
  // useOutsideClick(showDraftModal, [modalRef], () => setShowDraftModal(false))
  useOutsideClick(showDraftModal, [modalRef], () => {
    clearDraft(initialBoardType)
    setIsDraftChecked(true)
    setShowDraftModal(false)
  })

  // 임시저장 불러오기
  const handleLoadDraft = () => {
    const draft = getSavedDraft(initialBoardType)
    reset(draft) // 폼에 임시저장 데이터 로드
    setIsDraftChecked(true)
    setShowDraftModal(false)
  }

  // 새로 작성하기 (임시저장 삭제)
  const handleDiscardDraft = () => {
    clearDraft(initialBoardType)
    setIsDraftChecked(true)
    setShowDraftModal(false)
  }

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-gray-900/70 ${Z_INDEX.MODAL}`}>
      <div ref={modalRef} className="flex w-11/12 flex-col items-center gap-6 rounded-lg bg-white p-5 md:w-[16vw] md:min-w-80">
        <div className="flex w-full flex-col items-center gap-2">
          <h3 className="heading-h4">임시저장된 글이 있습니다</h3>
          <p>이어서 작성하시겠습니까?</p>
        </div>
        <div className="flex w-full gap-3">
          <Button type="button" size="md" className="flex-1 cursor-pointer border border-gray-300" onClick={handleDiscardDraft}>
            취소
          </Button>
          <Button
            type="button"
            size="md"
            className="bg-primary-300 flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-white"
            onClick={handleLoadDraft}
          >
            확인
          </Button>
        </div>
      </div>
    </div>
  )
}
