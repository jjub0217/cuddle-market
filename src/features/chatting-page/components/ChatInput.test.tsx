import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import ChatInput from './ChatInput'

// 채팅 입력칸은 글이 길어지면 아래로 자란다(#880).
//
// 예전에는 rows={1} 에 고정돼 있어 **지금 쓰는 줄만 보이고 앞서 쓴 줄이 위로 밀려 안 보였다.**
// 보내기 전에 전체를 다시 읽을 수가 없었다. 앱은 처음부터 여섯 줄까지 늘어났다.
//
// ⚠️ jsdom 은 글을 실제로 배치하지 않아 scrollHeight 가 늘 0이다. 그래서 **잰 높이를
//    우리가 심어 준다** — 「잰 값을 어떻게 쓰는가」가 이 시험이 지키려는 것이다.
let measuredHeight = 0
const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')

beforeEach(() => {
  Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => measuredHeight,
  })
})

afterAll(() => {
  if (original) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', original)
})

const noop = vi.fn()

describe('채팅 입력칸 높이', () => {
  it('한 줄이면 잰 높이를 그대로 쓴다', () => {
    measuredHeight = 36
    render(<ChatInput value="안녕하세요" onChange={noop} onSubmit={noop} />)

    expect(screen.getByPlaceholderText('메시지를 입력하세요')).toHaveStyle({ height: '36px' })
  })

  it('길어지면 120px 에서 멈춘다', () => {
    // 앱과 같은 값이다(mobile 의 maxHeight: 120). 여기를 넘으면 칸 안에서 스크롤한다.
    measuredHeight = 400
    render(<ChatInput value={'긴 글\n'.repeat(30)} onChange={noop} onSubmit={noop} />)

    expect(screen.getByPlaceholderText('메시지를 입력하세요')).toHaveStyle({ height: '120px' })
  })
})
