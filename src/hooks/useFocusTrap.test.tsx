import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { useFocusTrap } from './useFocusTrap'

// ⚠️ **껍데기 이름만 영어다.** react-hooks/rules-of-hooks 는 **대문자로 시작하는 이름**만
//    컴포넌트로 봐서, 한글 이름을 쓰면 「컴포넌트가 아닌데 훅을 부른다」로 막는다.
//    `pnpm lint` 는 게이트(오류 0건)라 그대로 두면 커밋이 막힌다.

// 손으로 만든 오버레이의 초점 가둠(#981).
//
// ⚠️ **jsdom 은 탭 키로 초점을 저절로 옮겨 주지 않는다.** 그래서 「탭을 누르면 다음으로 간다」는
//    브라우저 몫이고 여기서 못 본다. 이 훅이 맡는 것은 **경계에서 되돌리는 것**이라,
//    그 되돌림만 지킨다. userEvent 는 탭 이동을 흉내 내 주므로 경계 검사는 할 수 있다.

function TrapBox({ isOpen }: { isOpen: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen)
  if (!isOpen) return null
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="시험용 상자">
      <button type="button">처음</button>
      <button type="button">가운데</button>
      <button type="button">마지막</button>
    </div>
  )
}

function TestScreen() {
  const [열림, 열기] = useState(false)
  // 「바깥 단추」를 누르면 값이 바뀌어 화면이 다시 그려진다 — 상자의 DOM 노드가 갈린다.
  const [셈, 세기] = useState(0)
  return (
    <div key={셈}>
      <button type="button" onClick={() => 열기(true)}>
        열기
      </button>
      <button type="button" onClick={() => 열기(false)}>
        닫기
      </button>
      <button type="button" onClick={() => 세기((n) => n + 1)}>
        바깥 단추
      </button>
      <TrapBox isOpen={열림} />
    </div>
  )
}

describe('useFocusTrap', () => {
  it('열면 상자 안 첫 요소로 초점이 들어간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)

    await 사용자.click(screen.getByRole('button', { name: '열기' }))

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '처음' }))
  })

  it('마지막에서 탭을 누르면 처음으로 돌아온다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    await 사용자.click(screen.getByRole('button', { name: '열기' }))

    screen.getByRole('button', { name: '마지막' }).focus()
    await 사용자.tab()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '처음' }))
  })

  it('처음에서 시프트탭을 누르면 마지막으로 간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    await 사용자.click(screen.getByRole('button', { name: '열기' }))

    screen.getByRole('button', { name: '처음' }).focus()
    await 사용자.tab({ shift: true })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '마지막' }))
  })

  it('닫으면 열기 전에 있던 자리로 초점이 돌아간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    const 열기단추 = screen.getByRole('button', { name: '열기' })

    await 사용자.click(열기단추)
    await 사용자.click(screen.getByRole('button', { name: '닫기' }))

    expect(document.activeElement).toBe(열기단추)
  })
})
