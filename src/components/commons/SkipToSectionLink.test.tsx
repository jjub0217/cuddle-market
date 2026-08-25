import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import SkipToSectionLink from './SkipToSectionLink'

// `SkipToSectionLink` 는 매번 거쳐야 하는 덩어리(홈의 필터) **앞**에 두는 건너뛰기
// 링크다(#1072). 홈에서 상품 목록까지 Tab 이 65번 걸려서 만든 것이다.
//
// ⚠️ jsdom 은 `<a href="#id">` 의 기본 이동(그 id 로 스크롤·초점)을 흉내 내지 않는다.
//    그래서 이 컴포넌트는 onClick 안에서 `focus()` 를 직접 부른다 — 그 방식이라야
//    「정말 초점이 옮겨 가는지」를 시험으로 확인할 수 있다.
//
// ⚠️ **jsdom 은 「초점을 받으면 화면에 보인다」를 못 잰다.** CSS 를 안 그리기 때문이다.
//    여기서는 `sr-only`(평소 숨김) 와 `focus:not-sr-only`(초점 때 보임) 가 **붙어 있는지**
//    까지만 본다. 정말 보이는지는 크롬으로 눈으로 봐야 한다.

describe('SkipToSectionLink', () => {
  it('누르면 목적지(targetId)로 초점이 옮겨간다', async () => {
    const 사용자 = userEvent.setup()
    render(
      <>
        <SkipToSectionLink targetId="product-list" label="필터 건너뛰고 상품 목록 보기" />
        <section id="product-list" tabIndex={-1}>
          상품 목록
        </section>
      </>
    )
    await 사용자.click(screen.getByRole('link'))
    expect(document.activeElement).toBe(document.getElementById('product-list'))
  })

  it('화면을 목록 **시작**에 맞춘다 — 크롬 기본값(가운데)에 맡기지 않는다', async () => {
    // ⚠️ 이것이 왜 필요한지: 크롬은 초점을 줄 때 그 요소를 화면 **가운데**에 맞춘다.
    //    목록이 화면보다 길면 시작점이 위로 잘려 나간다 — 홈에서 재니 **274px** 사라져
    //    도구줄(탭·정렬)이 안 보였다(2026-08-25). 그래서 초점의 스크롤을 끄고 직접 맞춘다.
    //
    // ⚠️ jsdom 은 스크롤을 아예 안 한다(`scrollIntoView` 는 vitest.setup.ts 의 빈 함수다).
    //    그래서 「정말 시작에 섰는가」가 아니라 **「무엇을 시켰는가」**를 본다 —
    //    결과를 못 보는 자리에서는 원인을 직접 봐야 회귀를 잡는다(#1062 에서 배운 것).
    const 사용자 = userEvent.setup()
    const 스크롤염탐 = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(
      <>
        <SkipToSectionLink targetId="product-list" label="필터 건너뛰고 상품 목록 보기" />
        <section id="product-list" tabIndex={-1}>
          상품 목록
        </section>
      </>
    )
    const 목적지 = document.getElementById('product-list') as HTMLElement
    const 초점염탐 = vi.spyOn(목적지, 'focus')

    await 사용자.click(screen.getByRole('link'))

    expect(초점염탐).toHaveBeenCalledWith({ preventScroll: true })
    expect(스크롤염탐).toHaveBeenCalledWith({ block: 'start' })
    스크롤염탐.mockRestore()
  })

  it('href 는 지우지 않는다 — 자바스크립트가 안 돌아도 최소한 그 자리로는 가야 한다', () => {
    render(<SkipToSectionLink targetId="product-list" label="필터 건너뛰고 상품 목록 보기" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '#product-list')
  })

  it('대상 id 가 화면에 없어도 에러 없이 넘어간다', async () => {
    const 사용자 = userEvent.setup()
    render(<SkipToSectionLink targetId="no-such-section" label="건너뛰기" />)
    await expect(사용자.click(screen.getByRole('link'))).resolves.not.toThrow()
  })

  it('평소에는 숨고(sr-only) 초점을 받으면 보인다(focus:not-sr-only)', () => {
    render(<SkipToSectionLink targetId="product-list" label="필터 건너뛰고 상품 목록 보기" />)
    const 링크 = screen.getByRole('link')
    expect(링크).toHaveClass('sr-only')
    expect(링크).toHaveClass('focus:not-sr-only')
  })

  it('목적지가 늘 있으므로 조건 없이 그린다 — 다음 페이지 여부를 안 본다', () => {
    render(<SkipToSectionLink targetId="product-list" label="필터 건너뛰고 상품 목록 보기" />)
    expect(screen.getByRole('link', { name: '필터 건너뛰고 상품 목록 보기' })).toBeInTheDocument()
  })
})
