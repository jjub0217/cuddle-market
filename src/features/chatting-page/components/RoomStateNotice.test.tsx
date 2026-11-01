import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/render'
import RoomStateNotice from './RoomStateNotice'

// 멈추거나 닫힌 방은 입력칸 대신 이유를 말한다 (#1126, 설계 9절). 누구와 예약했는지는 말하지 않는다
describe('RoomStateNotice', () => {
  it.each([
    ['PAUSED_RESERVED', '예약된 상품이에요'],
    ['CLOSED_SOLD', '판매 완료된 상품이에요'],
    ['CLOSED_DONE', '거래가 끝난 채팅방이에요'],
  ] as const)('%s → %s', (roomState, text) => {
    render(<RoomStateNotice roomState={roomState} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('OPEN 이면 아무것도 안 그린다', () => {
    const { container } = render(<RoomStateNotice roomState="OPEN" />)
    expect(container).toBeEmptyDOMElement()
  })
})
