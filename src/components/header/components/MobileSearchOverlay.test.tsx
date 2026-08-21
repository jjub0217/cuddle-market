import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import MobileSearchOverlay from './MobileSearchOverlay'

// 모바일 검색 오버레이의 **초점 가둠 연결**만 지킨다(#981).
//
// 가둠 자체가 어떻게 도는지는 `src/hooks/useFocusTrap.test.tsx` 가 이미 덮는다.
// 여기서 지키고 싶은 것은 이 화면에만 있는 것 둘이다.
//   1. 초점이 **상자가 아니라 검색칸**으로 간다 (열자마자 바로 칠 수 있어야 한다)
//   2. 상자에 ref 가 실제로 달려 있어 경계에서 되돌아온다
//
// ⚠️ 이 화면에는 「300ms 뒤 검색칸 자동 포커스」가 따로 있다. 그것을 묶어 두려고
//    가짜 시계(vi.useFakeTimers)를 써 봤더니 **세 시험이 모두 5초를 다 쓰고 죽었다** —
//    RTL 의 act 와 userEvent 가 진짜 시계를 기다린다. 그래서 진짜 시계로 돈다.
//    시험 하나가 300ms 안에 끝나므로 그 자동 포커스는 여기까지 오지 않는다
//    (아래 각 시험이 몇 ms 걸리는지는 `npx vitest run` 출력으로 확인했다 — 2026-08-21 에 셋이 149ms).
//
//    ⚠️ **이것은 시간에 기댄다.** 언젠가 이 시험들이 300ms 를 넘게 느려지면 자동 포커스가
//       끼어들어 조용히 흔들릴 수 있다. 「가끔 실패한다」가 나오면 여기부터 보라.

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// ⚠️ **껍데기 이름만 영어다.** react-hooks/rules-of-hooks 는 **대문자로 시작하는 이름**만
//    컴포넌트로 봐서, 한글 이름을 쓰면 「컴포넌트가 아닌데 훅(useState)을 부른다」로 막는다.
//    `pnpm lint` 는 게이트(오류 0건)라 그대로 두면 커밋이 막힌다.
function TestScreen() {
  const [열림, 열기] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => 열기(true)}>
        검색 열기
      </button>
      <MobileSearchOverlay isOpen={열림} onClose={() => 열기(false)} />
    </div>
  )
}

function 사용자만들기() {
  // delay: null — userEvent 가 글쇠 사이에 쉬지 않는다. 시험이 300ms 안에 끝나게 하는 쪽.
  return userEvent.setup({ delay: null })
}

describe('MobileSearchOverlay 초점 가둠', () => {
  it('열면 초점이 상자가 아니라 검색칸으로 들어간다', async () => {
    const 사용자 = 사용자만들기()
    render(<TestScreen />)

    await 사용자.click(screen.getByRole('button', { name: '검색 열기' }))

    // DOM 순서상 상자 안 첫 요소가 이 검색칸이다.
    // (돋보기 아이콘은 <div> 라 초점을 못 받고, 닫기 단추는 이보다 뒤에 있다)
    expect(document.activeElement).toBe(document.getElementById('search-mobile'))
    expect(document.activeElement).not.toBe(screen.getByRole('dialog'))
  })

  it('마지막 요소(닫기 단추)에서 탭을 누르면 검색칸으로 돌아온다', async () => {
    const 사용자 = 사용자만들기()
    render(<TestScreen />)
    await 사용자.click(screen.getByRole('button', { name: '검색 열기' }))

    screen.getByRole('button', { name: '검색 닫기' }).focus()
    await 사용자.tab()

    expect(document.activeElement).toBe(document.getElementById('search-mobile'))
  })

  it('닫으면 열기 전에 있던 자리로 초점이 돌아간다', async () => {
    const 사용자 = 사용자만들기()
    render(<TestScreen />)
    const 열기단추 = screen.getByRole('button', { name: '검색 열기' })

    await 사용자.click(열기단추)
    await 사용자.click(screen.getByRole('button', { name: '검색 닫기' }))

    expect(document.activeElement).toBe(열기단추)
  })
})
