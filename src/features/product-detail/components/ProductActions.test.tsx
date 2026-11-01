import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@/test/render'
import ProductActions from './ProductActions'
import { fetchGraphQL } from '@/lib/api/graphql'

vi.mock('@/lib/api/graphql', () => ({ fetchGraphQL: vi.fn() }))
const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/store/userStore', () => ({
  useUserStore: (selector?: (s: unknown) => unknown) => {
    const state = { user: { id: 8 } }
    return selector ? selector(state) : state
  },
}))
vi.mock('@/hooks/useFavorite', () => ({ useFavorite: () => ({ isFavorite: false, handleToggleFavorite: vi.fn() }) }))

const seller = { sellerId: 1, sellerNickname: '판매자B', sellerProfileImageUrl: '' }

// 다른 사람과 예약된 상품에서 처음 채팅하려 하면, 브라우저 경고창 대신 이유를 말하는 창을 띄운다(#1126).
// 이미 대화하던 사람은 서버가 그 방을 돌려주므로 이 창을 보지 않는다.
describe('ProductActions 채팅하기', () => {
  beforeEach(() => {
    vi.mocked(fetchGraphQL).mockReset()
    push.mockReset()
  })

  it('예약된 상품에서 채팅을 시작할 수 없으면 경고창이 아니라 안내 창을 띄운다', async () => {
    vi.mocked(fetchGraphQL).mockRejectedValue(new Error('REST API error: 400'))
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<ProductActions id={1} isFavorite={false} sellerInfo={seller} tradeStatus="RESERVED" />)

    await userEvent.click(screen.getByRole('button', { name: '채팅하기' }))

    expect(await screen.findByText('예약된 상품이에요')).toBeInTheDocument()
    expect(screen.getByText('판매자가 다른 분과 예약한 상품이라 지금은 채팅을 시작할 수 없어요.')).toBeInTheDocument()
    expect(alert).not.toHaveBeenCalled()
    alert.mockRestore()
  })

  it('이미 대화하던 방을 서버가 돌려주면 그 방으로 간다', async () => {
    vi.mocked(fetchGraphQL).mockResolvedValue({ createChatRoom: { chatRoomId: 2 } })
    render(<ProductActions id={1} isFavorite={false} sellerInfo={seller} tradeStatus="RESERVED" />)

    await userEvent.click(screen.getByRole('button', { name: '채팅하기' }))

    expect(push).toHaveBeenCalledWith('/chat/2')
  })
})
