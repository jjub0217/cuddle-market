import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { MobileFilterSidebar, type DetailFilterValue } from './MobileFilterSidebar'

// 서랍이 **초점을 가두는지**만 본다(#981). 훅 자체는 useFocusTrap.test.tsx 가 덮으므로
// 여기서는 「이 화면이 그 훅을 쓰고 있는가」를 지킨다 — 훅을 떼면 여기가 빨개진다.
//
// ⚠️ 고르는 규칙(초안·적용·초기화)은 여기서 안 본다. 초점만이다.

const EMPTY: DetailFilterValue = { productStatus: null, price: null, sido: null, gugun: null }

// ⚠️ 시험용 껍데기 이름만 영어다. `react-hooks/rules-of-hooks` 는 **대문자로 시작하는 이름**만
//    컴포넌트로 보고, 한글 이름은 「컴포넌트가 아닌데 훅을 부른다」며 오류를 낸다(lint 는 게이트다).
function TestScreen() {
  const [열림, 열기] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => 열기(true)}>
        세부 필터
      </button>
      <button type="button">바깥 단추</button>
      <MobileFilterSidebar
        isOpen={열림}
        onClose={() => 열기(false)}
        value={EMPTY}
        onApply={() => {}}
        onReset={() => {}}
      />
    </div>
  )
}

describe('MobileFilterSidebar 초점 가둠', () => {
  it('열면 「필터 닫기」 단추로 초점이 들어간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)

    await 사용자.click(screen.getByRole('button', { name: '세부 필터' }))

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '필터 닫기' }))
  })

  it('맨 끝(적용)에서 탭을 누르면 서랍 처음으로 돌아온다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    await 사용자.click(screen.getByRole('button', { name: '세부 필터' }))

    screen.getByRole('button', { name: '적용' }).focus()
    await 사용자.tab()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '필터 닫기' }))
  })

  it('닫으면 열기 전에 있던 자리로 초점이 돌아간다', async () => {
    const 사용자 = userEvent.setup()
    render(<TestScreen />)
    const 여는단추 = screen.getByRole('button', { name: '세부 필터' })

    await 사용자.click(여는단추)
    await 사용자.click(screen.getByRole('button', { name: '필터 닫기' }))

    expect(document.activeElement).toBe(여는단추)
  })
})

// 닫혀 있는 동안 **탭 순서에서 빠지는지**(#999).
//
// ⚠️ **jsdom 은 `inert` 를 흉내 내지 못한다.** 진짜 브라우저에서는 `inert` 가 붙은 가지 안의
//    알약·[초기화][적용] 이 탭으로 안 잡히지만, jsdom 은 그 속성을 글자로만 들고 있다.
//    그래서 여기서 지킬 수 있는 것은 **속성이 붙었는가**까지다 — 「초점이 정말 막히는가」는
//    사람이 브라우저에서 탭을 눌러 봐야 한다.
// ⚠️ `getByRole('dialog')` 에 `hidden: true` 를 준다. 닫혔을 때는 `aria-hidden` 이 붙어
//    접근성 나무에서 빠지는데, 그러면 그냥 `getByRole` 로는 못 찾는다.
describe('MobileFilterSidebar 닫혔을 때 탭 순서', () => {
  it('닫혀 있으면 inert 가 붙는다', () => {
    render(
      <MobileFilterSidebar isOpen={false} onClose={() => {}} value={EMPTY} onApply={() => {}} onReset={() => {}} />
    )

    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('inert')
  })

  it('열려 있으면 inert 가 안 붙는다', () => {
    render(<MobileFilterSidebar isOpen onClose={() => {}} value={EMPTY} onApply={() => {}} onReset={() => {}} />)

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('inert')
  })
})
