import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import MobileNotificationsOverlay from './MobileNotificationsOverlay'

// 모바일 알림 오버레이가 **닫혀 있는 동안 탭 순서에서 빠지는가**만 지킨다(#999).
//
// ⚠️ **jsdom 은 `inert` 를 흉내 내지 못한다.** 초점이 진짜로 막히는지는 브라우저 몫이라
//    여기서 지킬 수 있는 것은 **속성이 붙었는가**까지다.
//
// 로그인하지 않은 상태로 그리므로(`enabled: !!user && isOpen`) 알림을 실제로 불러오지 않는다.
// 그래서 서버 흉내가 필요 없다.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// ⚠️ **껍데기 이름만 영어다.** react-hooks/rules-of-hooks 는 **대문자로 시작하는 이름**만
//    컴포넌트로 봐서, 한글 이름을 쓰면 「컴포넌트가 아닌데 훅(useState)을 부른다」로 막는다.
function TestScreen() {
  const [열림, 열기] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => 열기(true)}>
        알림 열기
      </button>
      <MobileNotificationsOverlay isOpen={열림} onClose={() => 열기(false)} />
    </div>
  )
}

describe('MobileNotificationsOverlay 닫힘 inert', () => {
  it('닫혀 있으면 inert 가 붙고, 열면 떨어진다', async () => {
    const 사용자 = userEvent.setup({ delay: null })
    const { container } = render(<TestScreen />)

    // 닫혀 있을 때는 role 로 못 찾는다(aria-hidden 이 같이 붙는다) — 속성으로 집는다
    const 상자 = container.querySelector('[aria-label="알림"]')!
    expect(상자.hasAttribute('inert')).toBe(true)

    await 사용자.click(screen.getByRole('button', { name: '알림 열기' }))
    expect(상자.hasAttribute('inert')).toBe(false)
  })
})
