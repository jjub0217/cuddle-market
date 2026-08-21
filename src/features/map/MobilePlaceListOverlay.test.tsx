import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import MobilePlaceListOverlay from './MobilePlaceListOverlay'

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
