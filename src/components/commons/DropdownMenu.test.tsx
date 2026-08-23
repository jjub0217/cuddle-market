import Link from 'next/link'
import { useRef, useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OVERLAY_ABOVE_ATTR } from '@/constants/ui'
import { render, screen } from '@/test/render'

import { DropdownMenu, DropdownMenuItem } from './DropdownMenu'

// 단추에 붙는 더보기 메뉴 (#1030).
//
// 시트에서 옮겨 온 계약을 여기서 지킨다 — ESC·바깥 눌러 닫기·「내가 위에 있다」 표식(#1003)·
// 링크 안에서 눌러도 링크가 안 눌리기(#793)·닫을 때 초점 되돌리기(#981).
//
// ⚠️ **자리(몇 픽셀에 그려지나)와 잘림은 여기서 못 본다.** jsdom 에는 배치가 없다.
//    그건 크롬으로 본다 — 과제 2.

function Harness({ isOpen = true, onClose = vi.fn() }: { isOpen?: boolean; onClose?: () => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <div>
      <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
        ⋮
      </button>
      <DropdownMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} label="상품 메뉴">
        <DropdownMenuItem onClick={vi.fn()}>수정하기</DropdownMenuItem>
        <DropdownMenuItem tone="danger" onClick={vi.fn()}>
          삭제
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  )
}

describe('여닫기', () => {
  it('닫혀 있으면 아무것도 안 그린다', () => {
    render(<Harness isOpen={false} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('열면 항목이 보인다', () => {
    render(<Harness />)
    expect(screen.getByRole('menuitem', { name: '수정하기' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument()
  })

  it('ESC 를 누르면 닫는다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('바깥을 누르면 닫는다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <div>
        <Harness onClose={onClose} />
        <span>바깥</span>
      </div>
    )

    await user.click(screen.getByText('바깥'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('겹쳐 열렸을 때 ESC 를 누가 먹는가 (#1003)', () => {
  // 마이페이지에서는 패널 → 이 메뉴 → 삭제 모달이 세 겹으로 쌓인다.
  // 바깥(패널)은 `[data-overlay-above]` 가 DOM 에 있는지로 「내 위에 뭐가 있나」를 가른다.
  // 표식을 안 달면 ESC 한 번에 메뉴와 패널이 **같이** 닫힌다.

  it('열려 있는 동안 「내가 위에 있다」는 표식을 단다', () => {
    render(<Harness />)
    expect(document.querySelector(`[${OVERLAY_ABOVE_ATTR}]`)).not.toBeNull()
  })

  it('닫히면 표식도 같이 사라진다', () => {
    render(<Harness isOpen={false} />)
    expect(document.querySelector(`[${OVERLAY_ABOVE_ATTR}]`)).toBeNull()
  })
})

describe('링크 안에서 열렸을 때 (#793)', () => {
  // 마이페이지 카드는 통째로 <Link> 다. portal 은 **DOM 에서만** body 로 나가고
  // 리액트 사건은 여전히 리액트 트리를 타고 올라간다. 막지 않으면 항목을 눌렀는데
  // 상세 페이지로 넘어간다.

  function LinkHarness({ onNavigate, onEdit }: { onNavigate: () => void; onEdit: (e: React.MouseEvent) => void }) {
    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
      <Link href="/products/1" onClick={onNavigate}>
        카드
        <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
          ⋮
        </button>
        <DropdownMenu isOpen onClose={vi.fn()} triggerRef={triggerRef} label="상품 메뉴">
          <DropdownMenuItem onClick={onEdit}>수정하기</DropdownMenuItem>
        </DropdownMenu>
      </Link>
    )
  }

  it('항목을 눌러도 바깥 링크가 안 눌린다', async () => {
    const onNavigate = vi.fn()
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<LinkHarness onNavigate={onNavigate} onEdit={onEdit} />)

    await user.click(screen.getByRole('menuitem', { name: '수정하기' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    // 여기서 1 이 나오면 메뉴를 고르는 대신 상세 페이지로 넘어간다
    expect(onNavigate).not.toHaveBeenCalled()
  })
})

describe('초점 (#981)', () => {
  it('열면 첫 항목으로 초점이 들어간다', async () => {
    function ToggleHarness() {
      const [open, setOpen] = useState(false)
      const triggerRef = useRef<HTMLButtonElement>(null)
      return (
        <div>
          <button type="button" ref={triggerRef} onClick={() => setOpen((p) => !p)} aria-label="상품 옵션 메뉴 열기">
            ⋮
          </button>
          <DropdownMenu isOpen={open} onClose={() => setOpen(false)} triggerRef={triggerRef} label="상품 메뉴">
            <DropdownMenuItem onClick={vi.fn()}>수정하기</DropdownMenuItem>
            <DropdownMenuItem tone="danger" onClick={vi.fn()}>
              삭제
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<ToggleHarness />)

    await user.click(screen.getByRole('button', { name: '상품 옵션 메뉴 열기' }))

    expect(screen.getByRole('menuitem', { name: '수정하기' })).toHaveFocus()
  })

  it('닫으면 열기 전 자리로 초점을 되돌린다', async () => {
    function ToggleHarness() {
      const [open, setOpen] = useState(false)
      const triggerRef = useRef<HTMLButtonElement>(null)
      return (
        <div>
          <button type="button" ref={triggerRef} onClick={() => setOpen((p) => !p)} aria-label="상품 옵션 메뉴 열기">
            ⋮
          </button>
          <DropdownMenu isOpen={open} onClose={() => setOpen(false)} triggerRef={triggerRef} label="상품 메뉴">
            <DropdownMenuItem onClick={vi.fn()}>수정하기</DropdownMenuItem>
          </DropdownMenu>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<ToggleHarness />)
    const trigger = screen.getByRole('button', { name: '상품 옵션 메뉴 열기' })

    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // ⚠️ 초점을 메뉴 안으로 옮겨 둔다. 안 옮기면 단추를 누른 채 그대로라
    //    「되돌렸다」인지 「원래 거기 있었다」인지 못 가린다.
    screen.getByRole('menuitem', { name: '수정하기' }).focus()
    expect(document.activeElement).not.toBe(trigger)

    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(trigger)
  })

  it('메뉴 안에서 탭을 누르면 닫힌다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onClose={onClose} />)

    // ESC 시험과 마찬가지로 메뉴가 열려 그려진 뒤 항목에 초점이 있는 상태에서 잰다.
    screen.getByRole('menuitem', { name: '수정하기' }).focus()

    await user.tab()

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('자리 안전망 — 화면 밖으로 안 나가게 (①②)', () => {
  // 배치(몇 픽셀에 그려지나)와 실제 뒤집힘은 jsdom 이 못 본다(getBoundingClientRect 가 늘 0).
  // 그래서 「①안전망이 실제로 걸려 있는가」·「자리가 모자라도 메뉴를 숨겨 버리지는 않는가」를
  // 대신 지킨다. 픽셀 값은 크롬으로 잰다(과제 2).

  it('메뉴에 maxHeight 가 걸려 있다', () => {
    render(<Harness />)

    const menu = screen.getByRole('menu')
    // 값이 정확히 몇 px 인지는 안 본다 — 「안전망이 달려 있다」만 본다
    expect(menu.style.maxHeight).not.toBe('')
  })

  it('화면이 아주 낮아도 메뉴는 그려지고 항목이 다 DOM 에 있다', () => {
    const original = window.innerHeight
    // 단추 자리도 jsdom 에서는 늘 (0,0,0,0)이라, 남는 자리가 음수가 되려면
    // 화면 높이를 GAP+여백(12px)보다 작게 줘야 한다.
    Object.defineProperty(window, 'innerHeight', { value: 5, configurable: true })

    try {
      render(<Harness />)

      // 자리가 모자란다고 메뉴를 통째로 숨기면(예: 이른 return null) 안 된다 —
      // maxHeight 로 가두고 스크롤시켜야지, 항목 자체를 지우면 안 된다.
      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.getAllByRole('menuitem')).toHaveLength(2)
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: original, configurable: true })
    }
  })
})

describe('못 누르는 항목 (disabled, #1034)', () => {
  // 프로필의 「신고완료」처럼 이미 끝난 일을 보여만 주는 줄이다. 프로필이 직접 아이콘 없는
  // <div role="menuitem"> 을 그리다가 DropdownMenuItem 과 여백이 어긋났던 것을, 조각이
  // disabled 를 갖는 것으로 옮겼다 — 여기서 그 계약을 지킨다.

  function DisabledFirstHarness({ isOpen = true, onClose = vi.fn() }: { isOpen?: boolean; onClose?: () => void }) {
    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
      <div>
        <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
          ⋮
        </button>
        <DropdownMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} label="상품 메뉴">
          <DropdownMenuItem disabled>신고완료</DropdownMenuItem>
          <DropdownMenuItem onClick={vi.fn()}>신고하기</DropdownMenuItem>
        </DropdownMenu>
      </div>
    )
  }

  it('button 이 아니라 div 로 그려지고 aria-disabled 가 붙는다', () => {
    render(<DisabledFirstHarness />)

    const item = screen.getByRole('menuitem', { name: '신고완료' })

    expect(item.tagName).toBe('DIV')
    expect(item).toHaveAttribute('aria-disabled', 'true')
  })

  it('열 때 초점이 못 누르는 첫 항목을 건너뛰고 그다음 누를 수 있는 항목으로 들어간다', async () => {
    function ToggleDisabledFirstHarness() {
      const [open, setOpen] = useState(false)
      const triggerRef = useRef<HTMLButtonElement>(null)
      return (
        <div>
          <button type="button" ref={triggerRef} onClick={() => setOpen((p) => !p)} aria-label="상품 옵션 메뉴 열기">
            ⋮
          </button>
          <DropdownMenu isOpen={open} onClose={() => setOpen(false)} triggerRef={triggerRef} label="상품 메뉴">
            <DropdownMenuItem disabled>신고완료</DropdownMenuItem>
            <DropdownMenuItem onClick={vi.fn()}>신고하기</DropdownMenuItem>
          </DropdownMenu>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<ToggleDisabledFirstHarness />)

    await user.click(screen.getByRole('button', { name: '상품 옵션 메뉴 열기' }))

    // 첫 DOM 순서는 「신고완료」(disabled)지만, 초점은 그걸 건너뛰고 눌리는 「신고하기」로 가야 한다
    expect(screen.getByRole('menuitem', { name: '신고하기' })).toHaveFocus()
  })
})

describe('항목', () => {
  it('누르면 그 항목의 일이 돈다', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    function Wrapper() {
      const triggerRef = useRef<HTMLButtonElement>(null)
      return (
        <div>
          <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
            ⋮
          </button>
          <DropdownMenu isOpen onClose={vi.fn()} triggerRef={triggerRef} label="상품 메뉴">
            <DropdownMenuItem onClick={onEdit}>수정하기</DropdownMenuItem>
          </DropdownMenu>
        </div>
      )
    }
    render(<Wrapper />)

    await user.click(screen.getByRole('menuitem', { name: '수정하기' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('위험한 항목은 색이 다르다', () => {
    render(<Harness />)
    expect(screen.getByRole('menuitem', { name: '삭제' })).toHaveClass('text-danger-500')
    expect(screen.getByRole('menuitem', { name: '수정하기' })).not.toHaveClass('text-danger-500')
  })
})
