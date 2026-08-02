import Link from 'next/link'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import { BottomSheet, BottomSheetItem } from './BottomSheet'

// 아래에서 올라오는 시트 (#793).
//
// 이슈가 「만들면 따라온다」고 적어 둔 것들이 실제로 되는지 본다 —
// ESC로 닫기 · 바깥 눌러 닫기 · 뒤 화면 스크롤 잠그기 · 포커스 옮기고 되돌리기.
// 취소 버튼은 일부러 안 둔다(앱·당근과 같다).

function Harness({ onClose = vi.fn(), isOpen = true }: { onClose?: () => void; isOpen?: boolean }) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="상품 메뉴">
      <BottomSheetItem onClick={vi.fn()}>수정하기</BottomSheetItem>
      <BottomSheetItem tone="danger" onClick={vi.fn()}>
        삭제
      </BottomSheetItem>
    </BottomSheet>
  )
}

describe('여닫기', () => {
  it('닫혀 있으면 아무것도 안 그린다', () => {
    render(<Harness isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('수정하기')).not.toBeInTheDocument()
  })

  it('열면 항목이 보인다', () => {
    render(<Harness />)

    expect(screen.getByRole('dialog', { name: '상품 메뉴' })).toBeInTheDocument()
    expect(screen.getByText('수정하기')).toBeInTheDocument()
    expect(screen.getByText('삭제')).toBeInTheDocument()
  })

  it('취소 버튼은 없다 — 바깥이나 ESC로 닫는다', () => {
    render(<Harness />)

    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument()
  })

  it('바깥을 누르면 닫는다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ESC를 누르면 닫는다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('링크 안에서 열렸을 때', () => {
  // 실기기에서 걸린 것 — 시트는 목록 카드 전체를 감싼 <Link> 안에서 열린다.
  // portal은 **DOM에서만** body로 나가고, React 이벤트는 여전히 React 트리를 따라
  // 올라간다. 막지 않으면 덮개를 눌렀을 때 링크가 눌린 셈이 되어 상세로 넘어간다.

  function LinkHarness({ onNavigate, onClose }: { onNavigate: () => void; onClose: () => void }) {
    return (
      <Link href="/products/1" onClick={onNavigate}>
        카드
        <BottomSheet isOpen onClose={onClose} label="상품 메뉴">
          <BottomSheetItem onClick={vi.fn()}>수정하기</BottomSheetItem>
        </BottomSheet>
      </Link>
    )
  }

  it('덮개를 눌러도 바깥 링크가 안 눌린다', async () => {
    const onNavigate = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<LinkHarness onNavigate={onNavigate} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    // 여기서 1이 나오면 시트를 닫는 대신 상세 페이지로 넘어간다
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('항목을 눌러도 바깥 링크가 안 눌린다', async () => {
    const onNavigate = vi.fn()
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(
      <Link href="/products/1" onClick={onNavigate}>
        카드
        <BottomSheet isOpen onClose={vi.fn()} label="상품 메뉴">
          <BottomSheetItem onClick={onEdit}>수정하기</BottomSheetItem>
        </BottomSheet>
      </Link>
    )

    await user.click(screen.getByText('수정하기'))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onNavigate).not.toHaveBeenCalled()
  })
})

describe('뒤 화면', () => {
  it('열려 있는 동안 스크롤을 잠근다', () => {
    const { unmount } = render(<Harness />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    // 닫으면 원래대로 돌려준다. 안 돌리면 페이지가 통째로 안 움직인다
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})

describe('포커스', () => {
  it('열면 첫 항목으로 포커스가 간다', () => {
    render(<Harness />)

    // 첫 요소는 덮개(닫기)이므로 그쪽이 잡힌다 — 키보드로 바로 닫거나 Tab 한 번에 항목으로 간다
    expect(document.activeElement).not.toBe(document.body)
  })
})

describe('항목', () => {
  it('누르면 그 항목의 일이 돈다', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(
      <BottomSheet isOpen onClose={vi.fn()} label="상품 메뉴">
        <BottomSheetItem onClick={onEdit}>수정하기</BottomSheetItem>
      </BottomSheet>
    )

    await user.click(screen.getByText('수정하기'))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('위험한 항목은 색이 다르다', () => {
    render(<Harness />)

    expect(screen.getByText('삭제').closest('button')).toHaveClass('text-danger-500')
    expect(screen.getByText('수정하기').closest('button')).not.toHaveClass('text-danger-500')
  })

  it('글자가 가운데에 온다', () => {
    // 항목 글자 길이가 제각각이라(「삭제」 ~ 「판매중으로 바꾸기」)
    // 한쪽에 붙이면 줄마다 끝이 들쭉날쭉해 보인다
    render(<Harness />)

    const item = screen.getByText('수정하기').closest('button')
    expect(item).toHaveClass('text-center')
    expect(item).toHaveClass('justify-center')
  })
})
