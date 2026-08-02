import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import { CommentSection } from './CommentSection'

// 댓글 덩어리를 조각으로 뺐다(상세 데스크톱 · 댓글 페이지 모바일이 같이 쓴다).
// 한쪽만 고쳐질 자리가 안 되게 여기서 묶는다.

vi.mock('@/lib/api/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector({ user: { id: 7 }, setRedirectUrl: vi.fn() }),
}))
vi.mock('@/store/modalStore', () => ({
  useLoginModalStore: (selector: (s: unknown) => unknown) => selector({ openLoginModal: vi.fn() }),
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/community/36',
  useSearchParams: () => new URLSearchParams(),
}))

const COMMENT = {
  id: 34,
  authorId: 8,
  authorNickname: '협주',
  authorProfileImageUrl: '',
  content: '좀만 더 줘봐요',
  createdAt: '2026-04-01T10:00:00',
  depth: 1,
  parentId: 0,
  hasChildren: false,
  childrenCount: 0,
}

describe('빈 상태', () => {
  it('댓글이 없으면 첫 댓글을 남기라고 한다', () => {
    render(<CommentSection postId="36" comments={[]} inputId="t" />)

    expect(screen.getByText('첫 댓글을 남겨보세요')).toBeInTheDocument()
  })

  it('빈 상태에서도 입력칸은 있다', () => {
    // 예전에는 「댓글 쓰기」 단추로 아래 고정 입력칸에 초점을 옮겼다.
    // 그 입력칸이 댓글 페이지로 옮겨 가면서 단추가 할 일이 없어졌다
    render(<CommentSection postId="36" comments={[]} inputId="t" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '댓글 쓰기' })).not.toBeInTheDocument()
  })
})

describe('목록', () => {
  it('댓글이 있으면 그린다', () => {
    render(<CommentSection postId="36" comments={[COMMENT]} inputId="t" />)

    expect(screen.getByText('좀만 더 줘봐요')).toBeInTheDocument()
    expect(screen.queryByText('첫 댓글을 남겨보세요')).not.toBeInTheDocument()
  })
})

describe('입력칸 id', () => {
  // 데스크톱 상세는 한 페이지에 댓글 입력칸이 하나뿐이지만,
  // 조각이 두 곳에서 쓰이므로 id를 밖에서 넣어 겹치지 않게 한다
  it('넘긴 id가 입력칸에 붙는다', () => {
    render(<CommentSection postId="36" comments={[]} inputId="comment-input-desktop" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'comment-input-desktop')
  })
})

describe('스레드 페이지에서', () => {
  it('맨 아래 「댓글 쓰기」 칸을 안 그린다', () => {
    // 그 칸은 글에 **새 댓글**을 다는 것이다. 답글을 달러 들어온 사람이
    // 잘못 쓰기 쉬워 스레드에서는 끈다.
    render(
      <CommentSection postId="36" comments={[COMMENT]} inputId="t" showComposer={false} />
    )

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('기본값은 그린다', () => {
    render(<CommentSection postId="36" comments={[COMMENT]} inputId="t" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
