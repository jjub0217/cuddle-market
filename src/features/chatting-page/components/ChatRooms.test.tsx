import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test/render'

import { ChatRooms } from './ChatRooms'
import type { fetchChatRoom } from '@/types'

// 채팅 목록의 안 읽음 배지 자리(#1136).
//
// 예전에는 배지가 줄 맨 오른쪽에 **따로 한 칸**(20px + 간격 10px)을 차지했다. 그래서 배지가 붙은
// 줄만 이름·시각·상품 칸이 30px 좁아졌다(크롬 실측 254 → 224).
// 지금은 마지막 메시지 줄의 오른쪽 끝에 둔다 — 줄어드는 것은 그 줄의 글자뿐이다.
//
// jsdom 은 폭을 못 잰다. 그래서 「몇 픽셀인가」 대신 **배지가 어느 줄에 들어 있나**(원인)를 본다.

const room: fetchChatRoom = {
  chatRoomId: 1,
  productId: 1,
  productTitle: '가방',
  productPrice: 20000,
  productImageUrl: '',
  opponentId: 2,
  opponentNickname: '구매자A',
  opponentProfileImageUrl: '',
  lastMessage: '결제가 완료됐어요',
  lastMessageTime: '2026-11-01T12:00:00',
  hasUnread: true,
  unreadCount: 3,
  isOpponentBlocked: false,
}

function renderRooms(rooms: fetchChatRoom[]) {
  return render(
    <ChatRooms
      rooms={rooms}
      handleSelectRoom={() => {}}
      selectedRoomId={null}
      hasNextPage={false}
      isFetchingNextPage={false}
      fetchNextPage={() => {}}
    />
  )
}

describe('채팅 목록의 안 읽음 배지', () => {
  it('마지막 메시지와 같은 줄에 들어 있다 — 줄 전체에 따로 칸을 차지하지 않는다', () => {
    renderRooms([room])

    const 배지 = screen.getByText('3')
    expect(배지.parentElement).toContainElement(screen.getByText('결제가 완료됐어요'))
    expect(배지.parentElement).not.toContainElement(screen.getByText('구매자A'))
  })

  it('안 읽은 것이 없으면 배지를 안 그린다', () => {
    renderRooms([{ ...room, hasUnread: false, unreadCount: 0 }])

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
