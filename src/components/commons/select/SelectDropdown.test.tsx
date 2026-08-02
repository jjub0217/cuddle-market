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

    await user.click(screen.getByRole('button', { name: '지역 선택' }))

    const option = await screen.findByRole('option', { name: /서울/ })
    // RTL이 그리는 컨테이너 밖(body 바로 아래)에 담긴다
    expect(option.closest('dialog')).toBeNull()
  })

  it('dialog 안에서 열면 그 dialog 안에 담는다', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('button', { name: '지역 선택' }))

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

    await user.click(screen.getByRole('button', { name: '지역 선택' }))

    expect(await screen.findByRole('option', { name: /서울/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /경기/ })).toBeInTheDocument()
  })

  it('고르면 값이 올라가고 닫힌다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={onChange} options={OPTIONS} placeholder="지역 선택" />)

    await user.click(screen.getByRole('button', { name: '지역 선택' }))
    await user.click(await screen.findByRole('option', { name: /경기/ }))

    expect(onChange).toHaveBeenCalledWith('gyeonggi')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('한 번 더 누르면 닫힌다', async () => {
    const user = userEvent.setup()
    render(<SelectDropdown value="" onChange={vi.fn()} options={OPTIONS} placeholder="지역 선택" />)

    const trigger = screen.getByRole('button', { name: '지역 선택' })
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

    await user.click(screen.getByRole('button', { name: '지역 선택' }))

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
