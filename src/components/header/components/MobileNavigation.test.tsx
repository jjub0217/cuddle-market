import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import MobileNavigation from './MobileNavigation'

// 모바일 사이드 메뉴가 **닫혀 있는 동안 탭 순서에서 빠지는가**만 지킨다(#999).
//
// 이 창은 닫혀도 DOM 에 남아 화면 밖(`translate-x-full`)으로 밀려 있을 뿐이라,
// 안의 링크(홈·이용약관·개인정보처리방침·계정 삭제 안내·1:1 문의)와 로그아웃 단추가
// **안 보이는데 탭으로 잡히고 엔터가 먹었다.** /mypage 에서 탭 4·6·9·10·11 이 그것이었다.
//
// ⚠️ **jsdom 은 `inert` 를 흉내 내지 못한다.** 초점이 진짜로 막히는지는 브라우저 몫이라
//    여기서 지킬 수 있는 것은 **속성이 붙었는가**까지다.
//    (탭이 실제로 본문으로 바로 넘어가는지는 사람이 좁은 폭 브라우저에서 확인해야 한다)

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
        메뉴 열기
      </button>
      <MobileNavigation isOpen={열림} onClose={() => 열기(false)} />
    </div>
  )
}

describe('MobileNavigation 닫힘 inert', () => {
  it('닫혀 있으면 inert 가 붙고, 열면 떨어진다', async () => {
    const 사용자 = userEvent.setup({ delay: null })
    const { container } = render(<TestScreen />)

    // 닫혀 있을 때는 role 로 못 찾는다(aria-hidden 이 같이 붙는다) — 요소로 집는다
    const 사이드메뉴 = container.querySelector('nav')!
    expect(사이드메뉴.hasAttribute('inert')).toBe(true)
    expect(사이드메뉴.getAttribute('aria-hidden')).toBe('true')

    await 사용자.click(screen.getByRole('button', { name: '메뉴 열기' }))

    expect(사이드메뉴.hasAttribute('inert')).toBe(false)
    expect(사이드메뉴.getAttribute('aria-hidden')).toBe('false')
  })
})
