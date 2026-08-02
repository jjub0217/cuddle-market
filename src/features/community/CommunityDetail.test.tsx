import { describe, expect, it, vi } from 'vitest'

import { render, screen, waitFor } from '@/test/render'

import CommunityDetail from './CommunityDetail'

// 모바일에서 댓글이 별도 페이지로 나갔다.
// 데스크톱은 상세 안에 그대로 있고, 모바일은 「댓글 N ›」 줄 하나만 남는다.
// 눈으로만 보면 폭에 따른 가르기가 슬그머니 어긋나도 모른다.

const POST = {
  id: 36,
  authorId: 8,
  authorNickname: '협주',
  authorProfileImageUrl: '',
  title: '강아지 첫 용품 추천?',
  content: '본문이에요',
  imageUrls: [],
  boardType: 'QUESTION',
  viewCount: 12,
  commentCount: 7,
  createdAt: '2026-04-01T10:00:00',
  updatedAt: '2026-04-01T10:00:00',
}

vi.mock('@/lib/api/api', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.endsWith('/comments')) {
        return Promise.resolve({ data: { data: { comments: [] } } })
      }
      return Promise.resolve({ data: { data: POST } })
    }),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector({ user: { id: 7 }, setRedirectUrl: vi.fn() }),
}))
vi.mock('@/store/modalStore', () => ({
  useLoginModalStore: (selector: (s: unknown) => unknown) => selector({ openLoginModal: vi.fn() }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: '36' }),
  usePathname: () => '/community/36/강아지첫용품추천',
  useSearchParams: () => new URLSearchParams(),
}))

async function renderDetail() {
  const result = render(<CommunityDetail />)
  await waitFor(() => expect(screen.getByRole('link', { name: /댓글/ })).toBeInTheDocument())
  return result
}

describe('폭에 따른 가르기', () => {
  it('데스크톱 댓글 묶음은 모바일에서 숨고 md에서 flex로 돌아온다', async () => {
    // md:block으로 바꾸면 세로 간격(gap-3.5)이 죽는다. 원래 flex flex-col이다
    await renderDetail()

    const section = screen.getByLabelText('댓글')
    expect(section).toHaveClass('hidden')
    expect(section).toHaveClass('md:flex')
    expect(section).not.toHaveClass('md:block')
    expect(section).toHaveClass('flex-col')
  })

  it('모바일 줄은 댓글 페이지로 가고 md에서 숨는다', async () => {
    await renderDetail()

    const link = screen.getByRole('link', { name: /댓글/ })
    expect(link).toHaveAttribute('href', '/community/36/강아지첫용품추천/comments')
    expect(link).toHaveClass('md:hidden')
  })
})

describe('모바일 고정 입력창', () => {
  it('상세에는 더 이상 없다 — 댓글 페이지로 옮겼다', async () => {
    // 예전에는 BottomNav 위에 fixed로 붙어 있었다
    const { container } = await renderDetail()

    expect(container.querySelector('#comment-input-mobile')).toBeNull()
  })
})
