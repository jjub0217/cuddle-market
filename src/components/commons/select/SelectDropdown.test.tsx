import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import SelectDropdown from './SelectDropdown'

// 선택 드롭다운. #788의 react-hooks/refs 4건이 여기다.
//
// 이슈가 경고한 것:
//   「<dialog> top-layer 문제를 푼 코드. 모달 안에서 드롭다운을 열면
//     옵션이 모달 뒤로 숨는 버그가 되살아남」
//
// <dialog showModal()>은 top-layer에 그려져서 z-index로는 못 이긴다.
// 그래서 dialog 안에서 열렸으면 **그 dialog 안에** 옵션을 담아야 보이고 눌린다.
// 이 시험의 알맹이는 **옵션이 어디에 담기는가**다.

const OPTIONS = [
  { value: 'seoul', label: '서울' },
  { value: 'gyeonggi', label: '경기' },
]

/** dialog 안에 넣어 그린다. jsdom의 showModal은 vitest.setup.ts에서 흉내 낸 것이다 */
function DialogHarness() {
  return (
    <dialog open data-testid="host-dialog">
      <SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />
    </dialog>
  )
}

describe('옵션을 담는 곳', () => {
  it('일반 페이지에서는 body에 담는다', async () => {
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />)

    await user.click(screen.getByRole('combobox', { name: '지역 선택' }))

    const option = await screen.findByRole('option', { name: /서울/ })
    // RTL이 그리는 컨테이너 밖(body 바로 아래)에 담긴다
    expect(option.closest('dialog')).toBeNull()
  })

  it('dialog 안에서 열면 그 dialog 안에 담는다', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('combobox', { name: '지역 선택' }))

    const option = await screen.findByRole('option', { name: /서울/ })
    // 여기서 null이 나오면 실제 화면에서 옵션이 모달 뒤로 숨는다
    expect(option.closest('dialog')).toBe(screen.getByTestId('host-dialog'))
  })
})

describe('여닫기', () => {
  it('처음에는 옵션이 안 보인다', () => {
    render(<SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />)

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('누르면 옵션이 다 나온다', async () => {
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />)

    await user.click(screen.getByRole('combobox', { name: '지역 선택' }))

    expect(await screen.findByRole('option', { name: /서울/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /경기/ })).toBeInTheDocument()
  })

  it('고르면 값이 올라가고 닫힌다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={onChange} options={OPTIONS} placeholder="지역 선택" />)

    await user.click(screen.getByRole('combobox', { name: '지역 선택' }))
    await user.click(await screen.findByRole('option', { name: /경기/ }))

    expect(onChange).toHaveBeenCalledWith('gyeonggi')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('한 번 더 누르면 닫힌다', async () => {
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />)

    const trigger = screen.getByRole('combobox', { name: '지역 선택' })
    await user.click(trigger)
    await screen.findByRole('option', { name: /서울/ })

    await user.click(trigger)

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('막아둔 상태면 안 열린다', async () => {
    const user = userEvent.setup()
    render(
      <SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" disabled />
    )

    await user.click(screen.getByRole('combobox', { name: '지역 선택' }))

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})

// 방향키로 고르는 것(#1064).
//
// 예전에는 `role="listbox"`·`role="option"` 을 쓰면서 **방향키 조작을 안 만들었다.**
// 그 역할은 「방향키로 고를 수 있다」는 약속이라 약속과 실제가 어긋나 있었고,
// 방향키를 누르면 눌린 키가 브라우저 기본 동작으로 흘러가 **페이지가 스크롤됐다.**
//
// ⚠️ **초점은 여는 단추에 남는다.** 항목으로 옮기지 않는 것이 listbox 의 표준이다 —
//    「지금 어디인가」는 `aria-activedescendant` 로 알린다. 그래서 아래 시험들은
//    「초점이 어디 있나」가 아니라 **그 속성이 무엇을 가리키나**를 본다.
describe('방향키로 고르기 (#1064)', () => {
  const 열기 = async () => {
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />)
    const trigger = screen.getByRole('combobox', { name: '지역 선택' })
    await user.click(trigger)
    await screen.findByRole('option', { name: /서울/ })
    return { user, trigger }
  }

  it('열면 첫 항목이 후보가 된다', async () => {
    const { trigger } = await 열기()
    const 후보 = document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')
    expect(후보).toHaveTextContent('서울')
  })

  it('↓ 를 누르면 다음 항목이 후보가 된다', async () => {
    const { user, trigger } = await 열기()
    await user.keyboard('{ArrowDown}')
    const 후보 = document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')
    expect(후보).toHaveTextContent('경기')
  })

  it('↑ 로 되돌아온다', async () => {
    const { user, trigger } = await 열기()
    await user.keyboard('{ArrowDown}{ArrowUp}')
    const 후보 = document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')
    expect(후보).toHaveTextContent('서울')
  })

  it('맨 끝에서 ↓ 를 더 눌러도 넘어가지 않는다', async () => {
    const { user, trigger } = await 열기()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    const 후보 = document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')
    expect(후보).toHaveTextContent('경기')
  })

  it('End 는 맨 끝으로, Home 은 맨 앞으로 간다', async () => {
    const { user, trigger } = await 열기()
    await user.keyboard('{End}')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('경기')
    await user.keyboard('{Home}')
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('서울')
  })

  it('엔터로 후보를 고른다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SelectDropdown value="" onChange={onChange} options={OPTIONS} placeholder="지역 선택" />)
    await user.click(screen.getByRole('combobox', { name: '지역 선택' }))
    await screen.findByRole('option', { name: /서울/ })
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('gyeonggi')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('⭐ 항목은 Tab 순서에서 빠진다', async () => {
    // `role="option"` 은 방향키로 옮기는 것이 표준이라 Tab 으로 하나씩 걸리면 안 된다.
    // 이 시험이 깨지면 초점 관리가 옛 방식으로 되돌아간 것이다.
    await 열기()
    for (const option of screen.getAllByRole('option')) {
      expect(option).toHaveAttribute('tabindex', '-1')
    }
  })

  it('⭐ 방향키의 기본 동작을 막는다', async () => {
    // ⚠️ 안 막으면 눌린 키가 브라우저로 흘러가 **페이지가 스크롤된다** — 고치기 전이 그랬다.
    //    jsdom 은 스크롤을 안 그리므로 「막았는가」를 사건으로 직접 확인한다.
    const { trigger } = await 열기()
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    trigger.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})
