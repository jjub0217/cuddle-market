import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/render'
import PaymentSuccess from './PaymentSuccess'
import { confirmPayment } from '@/lib/api/payment'

vi.mock('@/lib/api/payment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/payment')>()),
  confirmPayment: vi.fn(),
}))

let query = new URLSearchParams('paymentKey=pk_1&orderId=CM1&amount=50000')
vi.mock('next/navigation', () => ({
  useSearchParams: () => query,
}))

describe('결제 성공 페이지', () => {
  beforeEach(() => {
    vi.mocked(confirmPayment).mockReset()
    query = new URLSearchParams('paymentKey=pk_1&orderId=CM1&amount=50000')
  })

  it('주소의 paymentKey·orderId·amount 로 확정을 한 번만 부른다 (StrictMode 두 번 실행에도)', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({
      orderId: 'CM1', amount: 50000, productId: 10, productTitle: '신발', approvedAt: '2026-11-01T15:00:00',
    })
    render(<StrictMode><PaymentSuccess /></StrictMode>)

    await screen.findByText('신발')
    expect(confirmPayment).toHaveBeenCalledTimes(1)
    expect(confirmPayment).toHaveBeenCalledWith({ paymentKey: 'pk_1', orderId: 'CM1', amount: 50000 })
  })

  it('성공하면 상품 이름, 금액, 테스트 결제 안내, 채팅으로 돌아가는 링크를 보여 준다', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({
      orderId: 'CM1', amount: 50000, productId: 10, productTitle: '신발', approvedAt: '2026-11-01T15:00:00',
    })
    render(<PaymentSuccess />)

    expect(await screen.findByText('신발')).toBeInTheDocument()
    expect(screen.getByText(/50,000/)).toBeInTheDocument()
    expect(screen.getByText('테스트 결제예요. 실제로 돈이 나가지 않아요')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '채팅방으로 가기' })).toHaveAttribute('href', '/chat')
  })

  it('결과는 화면을 덮는 확인창 모양으로 보인다', async () => {
    // 2026-11-01 로컬 확인 뒤 사용자 요청: 결제 완료는 다른 확인창들과 같은 모달 모양으로
    vi.mocked(confirmPayment).mockResolvedValue({
      orderId: 'CM1', amount: 50000, productId: 10, productTitle: '신발', approvedAt: '2026-11-01T15:00:00',
    })
    render(<PaymentSuccess />)

    const dialog = await screen.findByRole('dialog', { name: '결제가 완료됐어요' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('결제한 그 채팅방 번호가 오면 「채팅으로 돌아가기」가 그 방으로 간다', async () => {
    vi.mocked(confirmPayment).mockResolvedValue({
      orderId: 'CM1', amount: 50000, productId: 10, productTitle: '신발', approvedAt: '2026-11-01T15:00:00', chatRoomId: 100,
    })
    render(<PaymentSuccess />)

    expect(await screen.findByRole('link', { name: '채팅방으로 가기' })).toHaveAttribute('href', '/chat/100')
  })

  it('서버가 거절하면 그 이유와 다시 시도할 길을 보여 준다', async () => {
    vi.mocked(confirmPayment).mockRejectedValue({
      response: { data: { message: '결제 금액이 상품 가격과 다릅니다. 다시 시도해 주세요.' } },
    })
    render(<PaymentSuccess />)

    expect(await screen.findByText('결제 금액이 상품 가격과 다릅니다. 다시 시도해 주세요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '채팅방으로 가기' })).toBeInTheDocument()
  })
})
