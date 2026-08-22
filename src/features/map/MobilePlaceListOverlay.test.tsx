import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Z_INDEX } from '@/constants/ui'
import MobilePlaceListOverlay from './MobilePlaceListOverlay'
import NaverMap from './NaverMap'

// 목록 오버레이가 **초점을 가두는지**만 본다(#981). 훅 자체는 useFocusTrap.test.tsx 가 덮는다.
//
// ⚠️ **줄 알맹이(PlaceList)는 가짜로 바꾼다.** 진짜는 서버(getPlaceDetail)·알림창까지 끌고 와서
//    초점과 상관없는 것들이 시험을 흔든다. 여기서 필요한 것은 「상자 안에 초점 줄 것이 하나 더
//    있다」는 사실뿐이다.
vi.mock('./PlaceList', () => ({
  PlaceList: () => (
    <button type="button">장소 하나</button>
  ),
}))

// ⚠️ 시험용 껍데기 이름만 영어다. `react-hooks/rules-of-hooks` 는 **대문자로 시작하는 이름**만
//    컴포넌트로 보고, 한글 이름은 「컴포넌트가 아닌데 훅을 부른다」며 오류를 낸다(lint 는 게이트다).
function TestScreen() {
  const [열림, 열기] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => 열기(true)}>
        목록 보기
      </button>
      <button type="button">바깥 단추</button>
      <MobilePlaceListOverlay isOpen={열림} onClose={() => 열기(false)} />
    </div>
  )
}

describe('MobilePlaceListOverlay 초점 가둠', () => {
  it('열면 「목록 닫기」 단추로 초점이 들어간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)

    await 사용자.click(screen.getByRole('button', { name: '목록 보기' }))

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '목록 닫기' }))
  })

  it('맨 끝에서 탭을 누르면 상자 처음으로 돌아온다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    await 사용자.click(screen.getByRole('button', { name: '목록 보기' }))

    screen.getByRole('button', { name: '장소 하나' }).focus()
    await 사용자.tab()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '목록 닫기' }))
  })

  it('닫으면 열기 전에 있던 자리로 초점이 돌아간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    const 여는단추 = screen.getByRole('button', { name: '목록 보기' })

    await 사용자.click(여는단추)
    await 사용자.click(screen.getByRole('button', { name: '목록 닫기' }))

    expect(document.activeElement).toBe(여는단추)
  })
})

// 닫혀 있는 동안 **탭 순서에서 빠지는지**(#999).
//
// ⚠️ **jsdom 은 `inert` 를 흉내 내지 못한다.** 진짜 브라우저에서는 `inert` 가 붙은 가지 안의
//    단추가 탭으로 안 잡히지만, jsdom 은 그 속성을 그냥 글자로만 들고 있다. 그래서 여기서
//    지킬 수 있는 것은 **속성이 붙었는가**까지다 — 「초점이 정말 막히는가」는 사람이
//    브라우저에서 탭을 눌러 봐야 한다.
// ⚠️ `getByRole('dialog')` 에 `hidden: true` 를 준다. 닫혔을 때는 `aria-hidden` 이 붙어
//    접근성 나무에서 빠지는데, 그러면 그냥 `getByRole` 로는 못 찾는다.
describe('MobilePlaceListOverlay 닫혔을 때 탭 순서', () => {
  it('닫혀 있으면 inert 가 붙는다', () => {
    render(<MobilePlaceListOverlay isOpen={false} onClose={() => {}} />)

    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('inert')
  })

  it('열려 있으면 inert 가 안 붙는다', () => {
    render(<MobilePlaceListOverlay isOpen onClose={() => {}} />)

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('inert')
  })
})

// 하단 탭바보다 **낮은 층**을 쓰는지(#998).
//
// ⚠️ **jsdom 에는 배치가 없다.** 「정말 탭바를 덮지 않는가」는 여기서 못 본다 —
//    쌓임 순서도, 여닫는 동안의 미끄러짐도 그려지지 않는다. 지킬 수 있는 것은
//    **어떤 층 클래스가 붙었는가**까지다. 눈으로는 좁은 폭(<768)에서 「목록 보기」를
//    눌러 열 때·닫을 때 탭바가 계속 보이는지 봐야 한다.
// ⚠️ 값을 글자 그대로(`'z-30'`) 적지 않고 `Z_INDEX` 에서 가져와 **숫자로** 견준다.
//    나중에 탭바 층이 바뀌어도 「탭바보다 높지 않다」는 규칙 자체가 그대로 지켜진다.
function 층수(className: string): number {
  // 'z-30' · 'z-[100]' 둘 다 받는다
  const 찾음 = className.split(' ').flatMap((c) => {
    const m = /^z-\[?(\d+)\]?$/.exec(c)
    return m ? [Number(m[1])] : []
  })
  expect(찾음).toHaveLength(1)
  return 찾음[0]
}

describe('MobilePlaceListOverlay 쌓임 순서', () => {
  // BottomNav 가 쓰는 값이다(components/bottom-nav/BottomNav.tsx).
  const 탭바층 = 층수(Z_INDEX.HEADER)

  it('탭바보다 높은 층을 쓰지 않는다', () => {
    render(<MobilePlaceListOverlay isOpen onClose={() => {}} />)

    expect(층수(screen.getByRole('dialog').className)).toBeLessThanOrEqual(탭바층)
  })

  it('닫혀 있을 때도 같은 층이다 — 내려가는 동안에도 탭바를 안 덮는다', () => {
    render(<MobilePlaceListOverlay isOpen={false} onClose={() => {}} />)

    expect(층수(screen.getByRole('dialog', { hidden: true }).className)).toBeLessThanOrEqual(탭바층)
  })
})

// 지도가 **자기 층을 상자 안에 가두는지**(#1003).
//
// 위 「쌓임 순서」와 **짝이다.** 목록을 z-30 으로 낮춘 것(#998)은 지도 칸이 SDK 의 층을
// 가둬 줄 때만 안전하다. 네이버 지도 SDK 는 저작권 표시(`div.map_copyright`)를
// **z-index:100** 짜리 칸에 담는데, 지도 상자가 쌓임 맥락을 안 만들면 그 100 이 바깥으로
// 나와 목록(30) 위에 그려진다. 2026-08-22 에 실제 크롬에서 재어 확인했고, 목록을 연
// 화면에 「© NAVER Corp.」 가 그대로 비쳤다.
//
// ⚠️ **jsdom 에는 지도 SDK 도 배치도 없다.** 진짜 저작권 요소가 안 만들어지니
//    「정말 안 보이는가」는 여기서 못 본다. 지킬 수 있는 것은 **지도 상자가 쌓임 맥락을
//    만드는 클래스를 달고 있는가**까지다. 눈으로는 좁은 폭(<768)에서 목록을 열어
//    흰 판에 「© NAVER Corp.」·네이버 로고가 안 비치는지 봐야 한다.
// ⚠️ **저작권을 감추는 시험이 아니다.** 지도 약관상 그 표시는 보여야 한다 —
//    목록이 덮을 뿐이고, 닫으면 다시 보인다.
describe('NaverMap 쌓임 맥락', () => {
  it('지도 상자가 SDK 의 층을 가둔다 — isolate 가 붙는다', () => {
    const { container } = render(<NaverMap />)

    const 지도상자 = container.querySelector('[data-naver-map]')
    expect(지도상자).toHaveClass('isolate')
  })
})
