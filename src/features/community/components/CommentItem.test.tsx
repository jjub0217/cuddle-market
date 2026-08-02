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

describe('스타일 값', () => {
  // 앱이 이 숫자를 그대로 옮겨 쓴다(10바퀴). 여기서 흔들리면 웹과 앱이 갈린다.
  // md: 분기를 없애 모바일·데스크톱이 한 벌이다.

  it('닉네임은 14px 한 벌이다', () => {
    render(<CommentItem comment={COMMENT} />)

    const name = screen.getByText('협주')
    expect(name).toHaveClass('text-sm')
    expect(name.className).not.toMatch(/md:text-/)
  })

  it('본문은 15px에 줄 간격이 좁다', () => {
    render(<CommentItem comment={COMMENT} />)

    const body = screen.getByText('좀만 더 줘봐요')
    expect(body).toHaveClass('text-[15px]')
    // leading-none(줄 간격 1)이면 두 줄 넘는 답글의 줄이 붙는다
    expect(body).toHaveClass('leading-snug')
    expect(body).not.toHaveClass('leading-none')
  })

  it('답글 상자 여백이 사방 14px이다', () => {
    const { container } = render(<CommentItem comment={COMMENT} isReply />)

    const box = container.querySelector('.bg-surface-container-low')
    expect(box).toHaveClass('p-[14px]')
  })

  it('폭에 따라 글자 굵기가 달라지지 않는다', () => {
    render(<CommentItem comment={COMMENT} />)

    const time = screen.getByText(/전$/)
    expect(time.className).not.toMatch(/md:font-/)
  })
})
