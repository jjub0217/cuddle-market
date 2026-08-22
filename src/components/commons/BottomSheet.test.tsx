import Link from 'next/link'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OVERLAY_ABOVE_ATTR } from '@/constants/ui'
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

describe('겹쳐 열렸을 때 ESC 를 누가 먹는가 (#1003)', () => {
  // 마이페이지에서는 오버레이가 세 겹까지 쌓인다 — 패널 → 이 시트 → 삭제 모달.
  // 셋이 다 ESC 를 듣기 때문에, 아래쪽 패널은 「내 위에 열린 것이 있으면 비킨다」로
  // 가른다. 그 판단의 근거가 이 표식이다. 표식이 사라지면 **ESC 한 번에 패널까지
  // 닫힌다** — 시험이 초록인데 화면에서만 드러나는 자리라 여기서 잠근다.
  it('열려 있는 동안 「내가 위에 있다」는 표식을 단다', () => {
    render(<Harness />)

    expect(document.querySelector(`[${OVERLAY_ABOVE_ATTR}]`)).not.toBeNull()
  })

  it('닫히면 표식도 같이 사라진다', () => {
    render(<Harness isOpen={false} />)

    expect(document.querySelector(`[${OVERLAY_ABOVE_ATTR}]`)).toBeNull()
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

    // 가두는 상자는 시트 판(role="dialog")이라 그 안의 첫 항목이 잡힌다.
    // 덮개(닫기)는 판 밖이라 여기서 잡히지 않는다 — ESC나 덮개 누르기로 닫는다.
    expect(document.activeElement).not.toBe(document.body)
    expect(screen.getByText('수정하기').closest('button')).toHaveFocus()
  })

  it('탭이 시트 밖으로 안 나간다 (#981)', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const 수정 = screen.getByText('수정하기').closest('button')
    const 삭제 = screen.getByText('삭제').closest('button')

    await user.tab()
    expect(삭제).toHaveFocus()

    // 마지막에서 한 번 더 누르면 덮개로 새지 않고 첫 항목으로 돈다
    await user.tab()
    expect(수정).toHaveFocus()

    // 시프트탭도 마찬가지로 안에서 돈다
    await user.tab({ shift: true })
    expect(삭제).toHaveFocus()
  })

  it('닫으면 열기 전 자리로 포커스를 되돌린다 (#981)', async () => {
    const user = userEvent.setup()

    function TriggerHarness() {
      const [열림, 열기] = useState(false)
      return (
        <>
          <button type="button" onClick={() => 열기(true)}>
            메뉴 열기
          </button>
          <BottomSheet isOpen={열림} onClose={() => 열기(false)} label="상품 메뉴">
            <BottomSheetItem onClick={vi.fn()}>수정하기</BottomSheetItem>
          </BottomSheet>
        </>
      )
    }

    render(<TriggerHarness />)
    const 여는단추 = screen.getByRole('button', { name: '메뉴 열기' })

    await user.click(여는단추)
    expect(screen.getByText('수정하기').closest('button')).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(여는단추).toHaveFocus()
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

// #981 — 열려 있는 동안 초점이 시트 안에 갇히는가.
//
// ⚠️ 실기기 확인에서 **가둠이 안 된다**고 나와서, 왜 그런지 여기서 재현한다.
describe('초점 가둠 (#981)', () => {
  it('열면 시트 안 첫 항목으로 초점이 들어간다', async () => {
    render(
      <BottomSheet isOpen onClose={() => {}} label="상태 바꾸기">
        <BottomSheetItem onClick={() => {}}>판매중</BottomSheetItem>
        <BottomSheetItem onClick={() => {}}>예약중</BottomSheetItem>
        <BottomSheetItem onClick={() => {}}>판매완료</BottomSheetItem>
      </BottomSheet>
    )

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '판매중' }))
  })

  it('마지막 항목에서 탭을 누르면 첫 항목으로 돌아온다', async () => {
    const user = userEvent.setup()
    render(
      <BottomSheet isOpen onClose={() => {}} label="상태 바꾸기">
        <BottomSheetItem onClick={() => {}}>판매중</BottomSheetItem>
        <BottomSheetItem onClick={() => {}}>예약중</BottomSheetItem>
        <BottomSheetItem onClick={() => {}}>판매완료</BottomSheetItem>
      </BottomSheet>
    )

    screen.getByRole('button', { name: '판매완료' }).focus()
    await user.tab()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '판매중' }))
  })
})
