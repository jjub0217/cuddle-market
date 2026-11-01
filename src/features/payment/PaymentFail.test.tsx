import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/render'
import PaymentFail from './PaymentFail'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('code=PAY_PROCESS_CANCELED&message=사용자가 결제를 취소했습니다'),
}))

describe('결제 실패 페이지', () => {
  it('주소의 message 를 보여 주고 채팅으로 돌아가는 링크를 준다', () => {
    render(<PaymentFail />)

    expect(screen.getByText('사용자가 결제를 취소했습니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '채팅으로 돌아가기' })).toHaveAttribute('href', '/chat')
  })
})
