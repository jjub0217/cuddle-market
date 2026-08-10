import Button from '../commons/button/Button'
import ModalTitle from './ModalTitle'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '../commons/InlineNotification'

// 채팅방 나가기 확인창.
//
// 나가기는 되돌릴 수 없다 — 대화 내용이 사라지고, 그 방을 다시 열 수도 없다
// (다시 들어가면 서버가 403 CHAT_ROOM_ACCESS_DENIED 를 준다). 그런데 전에는
// 메뉴에서 손가락이 미끄러지면 그걸로 끝이었다(#875).
//
// 문구는 앱과 같다(mobile/app/chat/[id].tsx) — 같은 동작이 매체마다 다르게 말하면 안 된다.
// 모양은 DeleteReplyModal 을 따랐다. 목적마다 창을 하나씩 두는 것이 이 저장소의 관례다.

interface LeaveChatRoomModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export default function LeaveChatRoomModal({ isOpen, onCancel, onConfirm }: LeaveChatRoomModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [leaveError, setLeaveError] = useState<React.ReactNode | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  const handleConfirm = async () => {
    try {
      await onConfirm()
      dialogRef.current?.close()
    } catch {
      // 창을 닫지 않는다 — 다시 시도할 수 있게 둔다.
      setLeaveError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">채팅방을 나가지 못했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>,
      )
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="leave-chat-room-modal-title"
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-96 md:max-w-md"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={onCancel}
    >
      <ModalTitle
        headingId="leave-chat-room-modal-title"
        heading="채팅방을 나갈까요?"
        description="나가면 이 채팅방의 대화 내용이 사라져요."
      />
      <AnimatePresence>
        {leaveError ? (
          <InlineNotification type="error" onClose={() => setLeaveError(null)}>
            {leaveError}
          </InlineNotification>
        ) : null}
      </AnimatePresence>
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          onClick={() => dialogRef.current?.close()}
          size="md"
          className="cursor-pointer rounded-lg border border-gray-300 bg-white"
        >
          취소
        </Button>
        <Button
          type="button"
          size="md"
          onClick={handleConfirm}
          className="bg-danger-600 cursor-pointer rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          나가기
        </Button>
      </div>
    </dialog>
  )
}
