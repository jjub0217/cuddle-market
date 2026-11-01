import type { ChatRoomState } from '@/types/chat'

// 멈추거나 닫힌 방에서 입력칸 대신 보이는 안내 (#1126, 설계 9절).
// 서버도 이 방에 오는 메시지를 거절한다 — 화면만 막는 것이 아니다.
// 문구에는 누구와 예약했는지 넣지 않는다.
const NOTICE: Record<Exclude<ChatRoomState, 'OPEN'>, string> = {
  PAUSED_RESERVED: '예약된 상품이에요',
  CLOSED_SOLD: '판매 완료된 상품이에요',
  CLOSED_DONE: '거래가 끝난 채팅방이에요',
}

export default function RoomStateNotice({ roomState }: { roomState: ChatRoomState }) {
  if (roomState === 'OPEN') return null
  // 입력칸 자리에 회색 글자만 두면 무엇이 놓였는지 구분이 안 된다(2026-11-01 로컬 확인). 입력칸과 같은 둥근 상자로 감싼다
  return (
    <p
      role="status"
      className="border-primary-100 bg-primary-50 rounded-3xl border px-4 py-3 text-center text-sm font-medium text-gray-700"
    >
      {NOTICE[roomState]}
    </p>
  )
}
