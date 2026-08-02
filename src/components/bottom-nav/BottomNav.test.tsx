import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import BottomNav from './BottomNav'

// 어느 화면에서 하단 탭바를 숨기는지.
//
// 예전 규칙(/^\/community\/\d+$/)은 「커뮤니티 상세」를 노렸지만 한 번도 안 걸렸다 —
// 그 주소는 slug가 붙은 곳으로 redirect만 하고 화면을 안 그린다. 주소 규칙은
// 눈으로는 맞는지 알기 어려워서 여기서 못 박는다.

let currentPath = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
}))

// 넓은 폭(xl)에서는 아예 안 그린다. 시험은 좁은 폭으로 둔다.
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}))

function renderAt(path: string) {
  currentPath = path
  return render(<BottomNav />)
}

const NAV = { name: '하단 메뉴' }

describe('탭바를 숨기는 곳', () => {
  it('댓글 스레드에서는 숨긴다', () => {
    // 하단에 답글 입력칸이 늘 열려 있어 탭바까지 있으면 아래가 두 겹이 된다
    renderAt('/community/36/강아지사료바꿨더니안먹어요/comments/34')

    expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
  })

  it('slug가 영문이어도 숨긴다', () => {
    renderAt('/community/36/dog-food/comments/34')

    expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
  })

  it('커뮤니티 수정에서는 숨긴다', () => {
    renderAt('/community/36/edit')

    expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
  })

  it('채팅방에서는 숨긴다', () => {
    renderAt('/chat/12')

    expect(screen.queryByRole('navigation', NAV)).not.toBeInTheDocument()
  })
})

describe('탭바를 두는 곳', () => {
  it('커뮤니티 상세에서는 둔다', () => {
    // 거기서 다른 탭으로 가는 일이 흔하다. 앱도 상세에 탭바를 둔다(2바퀴 규칙)
    renderAt('/community/36/강아지사료바꿨더니안먹어요')

    expect(screen.getByRole('navigation', NAV)).toBeInTheDocument()
  })

  it('커뮤니티 목록에서는 둔다', () => {
    renderAt('/community')

    expect(screen.getByRole('navigation', NAV)).toBeInTheDocument()
  })

  it('홈에서는 둔다', () => {
    renderAt('/')

    expect(screen.getByRole('navigation', NAV)).toBeInTheDocument()
  })
})
