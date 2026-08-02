import userEvent from '@testing-library/user-event'
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

describe('스레드 화면에서', () => {
  it('「댓글 쓰기」 칸 대신 답글 칸이 처음부터 열려 있다', () => {
    // 「댓글 쓰기」 칸은 글에 **새 댓글**을 다는 것이라 여기서는 끈다.
    // 대신 답글 칸이 처음부터 보인다 — 답글을 달러 들어온 자리다.
    render(
      <CommentSection
        postId="36"
        comments={[COMMENT]}
        inputId="t"
        showComposer={false}
        alwaysOpenReplyFor={COMMENT.id}
      />
    )

    expect(screen.getByPlaceholderText('답글을 입력하세요')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('댓글을 입력하세요')).not.toBeInTheDocument()
  })

  it('상세에서는 답글 칸이 처음에 닫혀 있다', () => {
    render(<CommentSection postId="36" comments={[COMMENT]} inputId="t" />)

    expect(screen.queryByPlaceholderText('답글을 입력하세요')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('댓글을 입력하세요')).toBeInTheDocument()
  })

  it('기본값은 그린다', () => {
    render(<CommentSection postId="36" comments={[COMMENT]} inputId="t" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})

describe('답글 칸이 눈에 보이게', () => {
  const REPLY_TARGET = { ...COMMENT, id: 34, hasChildren: false, childrenCount: 0 }

  it('「답글 달기」를 누르면 칸을 화면 안으로 옮기고 초점을 준다', async () => {
    // 칸이 화면 밖에 생기면 눌러도 아무 일도 안 일어난 것처럼 보인다.
    // 특히 맨 아래 답글에서 누르면 칸이 접힌 화면 밖이다.
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView')
    const user = userEvent.setup()
    render(<CommentSection postId="36" comments={[REPLY_TARGET]} inputId="t" />)

    await user.click(screen.getByRole('button', { name: '답글 달기' }))

    const input = await screen.findByPlaceholderText('답글을 입력하세요')
    expect(scrollSpy).toHaveBeenCalled()
    expect(input).toHaveFocus()

    scrollSpy.mockRestore()
  })

  it('커서가 @닉네임 뒤에 놓인다', async () => {
    // 그냥 focus만 하면 「@협주 」 앞에서 깜빡여서, 이어 치면 「안녕@협주 」가 된다
    const user = userEvent.setup()
    render(<CommentSection postId="36" comments={[REPLY_TARGET]} inputId="t" />)

    await user.click(screen.getByRole('button', { name: '답글 달기' }))

    const input = (await screen.findByPlaceholderText('답글을 입력하세요')) as HTMLTextAreaElement
    expect(input.value).toBe('@협주 ')
    expect(input.selectionStart).toBe(input.value.length)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('스레드 화면에 들어오자마자는 화면을 안 옮긴다', () => {
    // 칸이 처음부터 열려 있는데 들어오자마자 화면이 튀면 어리둥절하다
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView')

    render(
      <CommentSection
        postId="36"
        comments={[REPLY_TARGET]}
        inputId="t"
        showComposer={false}
        alwaysOpenReplyFor={REPLY_TARGET.id}
      />
    )

    expect(scrollSpy).not.toHaveBeenCalled()
    scrollSpy.mockRestore()
  })
})
