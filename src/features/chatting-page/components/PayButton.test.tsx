import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/test/render'
import PayButton from './PayButton'
import { createPaymentOrder } from '@/lib/api/payment'
import { isTossReady, startCardPayment } from '@/lib/payments/toss'

vi.mock('@/lib/api/payment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/payment')>()),
  createPaymentOrder: vi.fn(),
}))
vi.mock('@/lib/payments/toss', () => ({ isTossReady: vi.fn(), startCardPayment: vi.fn() }))

describe('PayButton', () => {
  beforeEach(() => {
    vi.mocked(createPaymentOrder).mockReset()
    vi.mocked(startCardPayment).mockReset()
    vi.mocked(isTossReady).mockReturnValue(true)
  })

  it('지금 가격과 테스트 결제 안내를 보여 준다', () => {
    render(<PayButton productId={10} price={45000} />)

    expect(screen.getByText(/45,000/)).toBeInTheDocument()
    expect(screen.getByText('테스트 결제예요. 실제로 돈이 나가지 않아요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '결제하기' })).toBeInTheDocument()
  })

  it('누르면 서버 주문을 만들고 그 주문으로 결제창을 연다', async () => {
    const order = { orderId: 'CM1', amount: 45000, orderName: '신발' }
    vi.mocked(createPaymentOrder).mockResolvedValue(order)
    render(<PayButton productId={10} price={45000} />)

    await userEvent.click(screen.getByRole('button', { name: '결제하기' }))

    await waitFor(() => expect(startCardPayment).toHaveBeenCalledWith(order))
    expect(createPaymentOrder).toHaveBeenCalledWith(10)
  })

  it('서버가 주문을 거절하면 이유를 보여 준다', async () => {
    vi.mocked(createPaymentOrder).mockRejectedValue({ response: { data: { message: '지금은 결제할 수 없습니다.' } } })
    render(<PayButton productId={10} price={45000} />)

    await userEvent.click(screen.getByRole('button', { name: '결제하기' }))

    expect(await screen.findByText('지금은 결제할 수 없습니다.')).toBeInTheDocument()
    expect(startCardPayment).not.toHaveBeenCalled()
  })

  it('클라이언트 키가 없으면 「결제 준비 중」으로 막는다', async () => {
    vi.mocked(isTossReady).mockReturnValue(false)
    render(<PayButton productId={10} price={45000} />)

    const button = screen.getByRole('button', { name: '결제 준비 중' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(button)
    expect(createPaymentOrder).not.toHaveBeenCalled()
  })
})
