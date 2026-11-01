import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/render'
import userEvent from '@testing-library/user-event'
import ReserveBuyerModal from './ReserveBuyerModal'
import { fetchChatPartners, reserveProduct } from '@/lib/api/reservation'

vi.mock('@/lib/api/reservation', () => ({
  fetchChatPartners: vi.fn(),
  reserveProduct: vi.fn(),
}))

const partners = [
  { userId: 8, nickname: '구경만', profileImageUrl: null, lastMessageAt: '2026-11-01T12:00:00' },
  { userId: 7, nickname: '신발사요', profileImageUrl: 'a.png', lastMessageAt: '2026-10-30T12:00:00' },
]

function renderModal(onReserved = vi.fn()) {
  render(<ReserveBuyerModal isOpen productId={10} onReserved={onReserved} onCancel={vi.fn()} />)
  return onReserved
}

describe('ReserveBuyerModal', () => {
  beforeEach(() => {
    vi.mocked(fetchChatPartners).mockReset()
    vi.mocked(reserveProduct).mockReset()
  })

  it('이 상품으로 채팅한 상대를 닉네임과 함께 보여 준다', async () => {
    vi.mocked(fetchChatPartners).mockResolvedValue(partners)
    renderModal()

    expect(await screen.findByRole('radio', { name: /신발사요/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /구경만/ })).toBeInTheDocument()
    expect(fetchChatPartners).toHaveBeenCalledWith(10)
  })

  it("빈 목록이면 '아직 채팅한 사람이 없어요' 가 보이고 확정 단추가 없다", async () => {
    vi.mocked(fetchChatPartners).mockResolvedValue([])
    renderModal()

    expect(await screen.findByText('아직 채팅한 사람이 없어요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '예약하기' })).not.toBeInTheDocument()
  })

  it('고르기 전에는 확정 단추가 눌리지 않는다', async () => {
    vi.mocked(fetchChatPartners).mockResolvedValue(partners)
    renderModal()
    await screen.findByRole('radio', { name: /신발사요/ })

    const confirm = screen.getByRole('button', { name: '예약하기' })
    // disabled 는 초점을 강제로 떼므로 aria-disabled 로 막는다(CLAUDE.md 의 jsdom 주의)
    expect(confirm).toHaveAttribute('aria-disabled', 'true')
    expect(confirm).not.toHaveAttribute('disabled')
    await userEvent.click(confirm)
    expect(reserveProduct).not.toHaveBeenCalled()
  })

  it('한 명을 고르고 확정하면 reserveProduct 를 부르고 onReserved 를 부른다', async () => {
    vi.mocked(fetchChatPartners).mockResolvedValue(partners)
    vi.mocked(reserveProduct).mockResolvedValue(undefined)
    const onReserved = renderModal()

    await userEvent.click(await screen.findByRole('radio', { name: /신발사요/ }))
    await userEvent.click(screen.getByRole('button', { name: '예약하기' }))

    await waitFor(() => expect(reserveProduct).toHaveBeenCalledWith(10, 7))
    expect(onReserved).toHaveBeenCalled()
  })
})
