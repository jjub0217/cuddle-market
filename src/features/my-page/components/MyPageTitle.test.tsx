import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import MyPageTitle from './MyPageTitle'

// 단추 높이는 Button 의 size="sm"(h-9, 36) 이 정한다.
// 여기서 h-fit 을 얹었더니 그것을 덮어 글자 줄높이 20 만 남았고, 단추가 납작해 보였다(#1000).
//
// jsdom 은 배치를 안 재므로 「몇 픽셀로 그려졌나」는 못 본다.
// 높이를 정하는 클래스가 그대로 남아 있는지만 지킨다.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MyPageTitle 단추', () => {
  it('Button 이 정한 높이(h-9)를 덮지 않는다', () => {
    render(<MyPageTitle heading="내가 등록한 상품" description="상품" count={3} buttonLabel="상품등록" navigateTo="/product-post" />)

    const button = screen.getByRole('button', { name: /상품등록/ })

    expect(button).toHaveClass('h-9')
    expect(button.className).not.toMatch(/\bh-fit\b/)
  })
})
