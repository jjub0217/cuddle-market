import { describe, expect, it } from 'vitest'

import { fireEvent, render, screen } from '@/test/render'
import type { Message } from '@/types/chat'

import { ChatLog } from './ChatLog'

// 채팅 사진에 확대창이 붙는다(#904).
//
// ⚠️ 사진 메시지는 content 가 비어 있고 imageUrl 에만 값이 있다.
//    사진의 alt 는 보낸 사람 이름이다(ChatLog 의 ChatImageMessage).
// ⚠️ 확대창 안의 사진은 alt 가 「홍길동 - 1」이라 말풍선 사진과 겹치지는 않는다.
//    그래도 「열렸는가」는 확대창에만 있는 **닫기 단추**로 본다 — alt 규칙이 바뀌어도 안 흔들린다.

function 사진메시지(덮어쓰기: Partial<Message> = {}): Message {
  return {
    messageId: 1,
    senderId: 9,
    senderNickname: '홍길동',
    messageType: 'IMAGE',
    content: '',
    imageUrl: 'https://cdn/a.jpg',
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-08-13T07:12:42',
    isMine: false,
    ...덮어쓰기,
  }
}

/** 말풍선에 그려진 사진. 확대창 안의 사진과 헷갈리지 않게 첫 번째를 집는다 */
const 말풍선사진 = () => screen.getAllByAltText('홍길동')[0]

describe('채팅 사진 확대창', () => {
  it('처음에는 닫혀 있다', () => {
    render(<ChatLog isLoadingMessages={false} errorMessages={null} roomMessages={[사진메시지()]} />)

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })

  it('사진 말풍선을 누르면 확대창이 열린다', () => {
    render(<ChatLog isLoadingMessages={false} errorMessages={null} roomMessages={[사진메시지()]} />)

    fireEvent.click(말풍선사진())

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })

  it('닫으면 다시 사라진다', () => {
    render(<ChatLog isLoadingMessages={false} errorMessages={null} roomMessages={[사진메시지()]} />)

    fireEvent.click(말풍선사진())
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })

  it('주소가 없는 사진은 눌러도 안 열린다', () => {
    // 자리표시자만 그려진 자리다 — 띄울 사진이 없다.
    render(<ChatLog isLoadingMessages={false} errorMessages={null} roomMessages={[사진메시지({ imageUrl: null })]} />)

    fireEvent.click(말풍선사진())

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })

  it('글 말풍선에는 확대창을 안 붙인다', () => {
    render(
      <ChatLog
        isLoadingMessages={false}
        errorMessages={null}
        roomMessages={[사진메시지({ messageType: 'TEXT', content: '안녕하세요', imageUrl: null })]}
      />
    )

    fireEvent.click(screen.getByText('안녕하세요'))

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })
})
