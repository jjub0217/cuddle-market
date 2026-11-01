'use client'

import { useEffect, useRef } from 'react'
import Button from '@/components/commons/button/Button'
import ModalTitle from '@/components/modal/ModalTitle'

// 다른 분과 예약된 상품에서 처음 채팅하려 할 때 띄우는 안내 (#1126).
// 브라우저 경고창은 이유를 말하지 못하고 모양도 서비스와 달라서 창으로 바꿨다.
// 문구에 누구와 예약했는지는 넣지 않는다.

interface ReservedProductModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReservedProductModal({ isOpen, onClose }: ReservedProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reserved-product-modal-title"
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-96 md:max-w-md"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={onClose}
    >
      <ModalTitle
        headingId="reserved-product-modal-title"
        heading="예약된 상품이에요"
        description="판매자가 다른 분과 예약한 상품이라 지금은 채팅을 시작할 수 없어요."
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="md"
          onClick={() => dialogRef.current?.close()}
          className="bg-primary-600 cursor-pointer rounded-lg text-white"
        >
          확인
        </Button>
      </div>
    </dialog>
  )
}
