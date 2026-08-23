import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test/render'

import ChatProductCard from './ChatProductCard'

// 채팅방 상품 카드. #1035 — 「판매완료 처리」를 눌러도 화면에 변화가 없던 것을,
// 썸네일 위 거래 상태 뱃지로 그 자리에서 보이게 한다.

describe('거래 상태 뱃지', () => {
  it('tradeStatus 를 안 주면 뱃지가 없다', () => {
    render(<ChatProductCard productTitle="상품" productPrice={1000} />)
    expect(screen.queryByText('판매완료')).not.toBeInTheDocument()
    expect(screen.queryByText('예약중')).not.toBeInTheDocument()
  })

  it("'COMPLETED' 면 「판매완료」가 보인다", () => {
    render(<ChatProductCard productTitle="상품" productPrice={1000} tradeStatus="COMPLETED" />)
    expect(screen.getByText('판매완료')).toBeInTheDocument()
  })

  it("'RESERVED' 면 「예약중」이 보인다", () => {
    render(<ChatProductCard productTitle="상품" productPrice={1000} tradeStatus="RESERVED" />)
    expect(screen.getByText('예약중')).toBeInTheDocument()
  })

  it("'SELLING' 이면 뱃지가 없다", () => {
    render(<ChatProductCard productTitle="상품" productPrice={1000} tradeStatus="SELLING" />)
    expect(screen.queryByText('판매완료')).not.toBeInTheDocument()
    expect(screen.queryByText('예약중')).not.toBeInTheDocument()
  })
})
