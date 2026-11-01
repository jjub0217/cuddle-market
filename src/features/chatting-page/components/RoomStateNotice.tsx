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
  return <p className="text-center text-sm text-gray-500">{NOTICE[roomState]}</p>
}
