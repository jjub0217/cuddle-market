import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import SkipToLoadMoreLink from './SkipToLoadMoreLink'

// `SkipToLoadMoreLink` 는 무한 목록 **앞**에 두는 건너뛰기 링크다(#1061). 카드가 많은
// 목록에서는 짝이 되는 `LoadMoreFocusButton`(목록 끝)까지 Tab 이 수십~백 번 걸려서다
// (홈 실측 104번) — 이 링크를 누르면 곧장 그 단추로 초점이 건너뛴다.
//
// ⚠️ jsdom 은 `<a href="#id">` 의 기본 이동(그 id 로 스크롤·초점)을 흉내 내지 않는다.
//    그래서 이 컴포넌트는 onClick 안에서 `focus()` 를 직접 부른다 — 그 방식이라야
//    「정말 초점이 옮겨 가는지」를 시험으로 확인할 수 있다.

describe('SkipToLoadMoreLink', () => {
  it('다음 페이지가 없으면 그리지 않는다', () => {
    render(<SkipToLoadMoreLink targetId="target-button" hasNextPage={false} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('누르면 짝이 되는 단추(targetId)로 초점이 옮겨간다', async () => {
    const 사용자 = userEvent.setup()
    render(
      <>
        <SkipToLoadMoreLink targetId="target-button" hasNextPage />
        <button id="target-button" type="button">
          다음 페이지 불러오기
        </button>
      </>
    )
    await 사용자.click(screen.getByRole('link'))
    expect(document.activeElement).toBe(document.getElementById('target-button'))
  })

  it('href 는 지우지 않는다 — 자바스크립트가 안 돌아도 최소한 그 자리로는 가야 한다', () => {
    render(<SkipToLoadMoreLink targetId="target-button" hasNextPage />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '#target-button')
  })

  it('대상 id 가 화면에 없어도 에러 없이 넘어간다', async () => {
    const 사용자 = userEvent.setup()
    render(<SkipToLoadMoreLink targetId="no-such-button" hasNextPage />)
    await expect(사용자.click(screen.getByRole('link'))).resolves.not.toThrow()
  })
})
