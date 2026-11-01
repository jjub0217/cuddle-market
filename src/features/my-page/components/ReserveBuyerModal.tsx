'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import Button from '@/components/commons/button/Button'
import ModalTitle from '@/components/modal/ModalTitle'
import InlineNotification from '@/components/commons/InlineNotification'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import { cn } from '@/lib/utils/cn'
import { fetchChatPartners, reserveProduct } from '@/lib/api/reservation'

// 판매자가 「예약중」을 고르면 뜨는 창 (#1126, 설계 9절).
//
// 이 상품으로 채팅한 상대 중 한 명을 골라 예약한다. 서버가 그 사람만 대화·결제를 이어 가게 한다.
// 모양은 LeaveChatRoomModal 을 따랐다(목적마다 창 하나가 이 저장소의 관례).

interface ReserveBuyerModalProps {
  isOpen: boolean
  productId: number
  onReserved: () => void
  onCancel: () => void
}

export default function ReserveBuyerModal({ isOpen, productId, onReserved, onCancel }: ReserveBuyerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const { data: partners, isLoading } = useQuery({
    queryKey: ['chatPartners', productId],
    queryFn: () => fetchChatPartners(productId),
    enabled: isOpen,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  const handleConfirm = async () => {
    // disabled 대신 aria-disabled 로 막는다 — disabled 는 이미 초점이 간 단추에서 초점을 강제로 뗀다
    if (selectedId === null) return
    try {
      await reserveProduct(productId, selectedId)
      dialogRef.current?.close()
      onReserved()
    } catch {
      setError(true)
    }
  }

  const isEmpty = !isLoading && (partners?.length ?? 0) === 0

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reserve-buyer-modal-title"
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-96 md:max-w-md"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={onCancel}
    >
      <ModalTitle
        headingId="reserve-buyer-modal-title"
        heading="누구와 예약할까요?"
        description="예약하면 이 분만 대화와 결제를 이어 갈 수 있어요."
      />
      <AnimatePresence>
        {error ? (
          <InlineNotification type="error" onClose={() => setError(false)}>
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-semibold">예약하지 못했습니다.</p>
              <p>잠시 후 다시 시도해주세요.</p>
            </div>
          </InlineNotification>
        ) : null}
      </AnimatePresence>
      {isEmpty ? (
        <p className="py-6 text-center text-sm text-gray-500">아직 채팅한 사람이 없어요</p>
      ) : (
        <ul role="radiogroup" aria-label="예약 상대" className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {(partners ?? []).map((partner) => {
            const checked = selectedId === partner.userId
            return (
              <li key={partner.userId}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setSelectedId(partner.userId)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left',
                    checked ? 'border-primary-400 bg-primary-50' : 'border-transparent hover:bg-gray-50'
                  )}
                >
                  <ProfileAvatar imageUrl={partner.profileImageUrl} nickname={partner.nickname} size="sm" />
                  <span className="text-sm font-medium text-gray-900">{partner.nickname}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          onClick={() => dialogRef.current?.close()}
          size="md"
          className="cursor-pointer rounded-lg border border-gray-300 bg-white"
        >
          취소
        </Button>
        {isEmpty ? null : (
          <Button
            type="button"
            size="md"
            aria-disabled={selectedId === null}
            onClick={handleConfirm}
            className="bg-primary-600 cursor-pointer rounded-lg text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            예약하기
          </Button>
        )}
      </div>
    </dialog>
  )
}
