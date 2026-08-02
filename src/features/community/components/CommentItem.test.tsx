import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import { CommentItem } from './CommentItem'

// 답글 접기 버튼을 없애고 멘션을 shared에서 가져오게 바꿨다.
// 눈으로만 보면 「답글 4개」 버튼이 슬그머니 되살아나도 모른다.

vi.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector({ user: { id: 7 } }),
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
  hasChildren: true,
  childrenCount: 4,
}

describe('접기 버튼', () => {
  it('답글이 있어도 「답글 N개」 버튼이 없다', () => {
    // 답글은 처음부터 펼쳐지므로 여닫는 단추가 필요 없다
    render(<CommentItem comment={COMMENT} />)

    expect(screen.queryByRole('button', { name: /답글 \d+개/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '답글 접기' })).not.toBeInTheDocument()
  })
})

describe('멘션', () => {
  it('맨 앞 @닉네임만 색을 다르게 한다', () => {
    render(<CommentItem comment={{ ...COMMENT, content: '@협주 ㅇㅇㅇ' }} isReply />)

    expect(screen.getByText('@협주')).toHaveClass('text-primary-container')
  })

  it('@가 없으면 그대로 그린다', () => {
    render(<CommentItem comment={{ ...COMMENT, content: 'ddd' }} isReply />)

    expect(screen.getByText('ddd')).toBeInTheDocument()
  })

  it('본문 중간의 @는 안 뗀다', () => {
    render(<CommentItem comment={{ ...COMMENT, content: '메일은 a@b.com 이에요' }} isReply />)

    expect(screen.getByText(/메일은 a@b.com 이에요/)).toBeInTheDocument()
  })
})

describe('내 댓글', () => {
  it('내 것이면 표가 붙고 삭제가 보인다', () => {
    render(<CommentItem comment={{ ...COMMENT, authorId: 7 }} onDelete={vi.fn()} />)

    expect(screen.getByText('내 댓글')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('남의 것이면 둘 다 없다', () => {
    render(<CommentItem comment={COMMENT} onDelete={vi.fn()} />)

    expect(screen.queryByText('내 댓글')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})
