import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import LoadMoreFocusButton from './LoadMoreFocusButton'

// `LoadMoreFocusButton` 은 무한 목록 끝에 두는 **화면엔 안 보이지만 Tab 으로는 걸리는
// 단추** 다(#1061).
//
// ⚠️ `disabled` 를 쓰면, 눌러서 `isFetchingNextPage` 가 true 가 되는 순간 **진짜 브라우저는**
//    초점을 강제로 뗀다(크롬 실측: 엔터 직후 초점 → 60ms 뒤 body 로 튕김, 520ms 뒤 disabled 가
//    풀려도 초점은 안 돌아옴). 그러면 건너뛰기 링크(`SkipToLoadMoreLink`)로 와도 이 단추를
//    다시 못 찾는다. 그래서 진짜 `disabled` 대신 `aria-disabled` + onClick 안 가드로 고쳤다.
//
// ⚠️ **이번 회귀의 진짜 파수꾼은 아래 ①번(disabled 속성 검사)이다.** `disabled` 로 직접
//    되돌려서 확인했다 — ①번은 깨지고(속성이 다시 붙으므로), 그 아래 「초점을 잃지 않는다」
//    시험은 **안 깨졌다.** jsdom 은 「disabled 가 붙으면 이미 가진 초점을 강제로 뗀다」는
//    실제 브라우저 동작을 안 흉내 낸다 — 그래서 그 시험만으로는 이 회귀를 못 잡는다.
//    「초점을 잃지 않는다」쪽은 원하는 동작을 문서로 남기는 뜻으로 그대로 두되, 실제 파수꾼은
//    ①번이라는 것을 여기 적어 둔다.

describe('LoadMoreFocusButton', () => {
  it('다음 페이지가 없으면 그리지 않는다', () => {
    render(<LoadMoreFocusButton id="test-button" hasNextPage={false} isFetchingNextPage={false} onLoadMore={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  // ① 이번 회귀의 진짜 파수꾼. `disabled={isFetchingNextPage}` 로 되돌리면 이 시험이 깨진다
  //    (직접 되돌려서 확인함 — 작업 보고에 실행 결과를 그대로 남긴다).
  it('진짜 disabled 속성은 안 붙이고, aria-disabled 로만 알린다', () => {
    render(<LoadMoreFocusButton id="test-button" hasNextPage isFetchingNextPage onLoadMore={vi.fn()} />)
    const 단추 = screen.getByRole('button')
    expect(단추).not.toHaveAttribute('disabled')
    expect(단추).toHaveAttribute('aria-disabled', 'true')
  })

  // ⚠️ jsdom 은 「disabled 가 붙으면 이미 가진 초점을 뗀다」를 흉내 내지 않아서, 이 시험은
  //    `disabled` 로 되돌려도 통과해 버린다(직접 확인함) — 그래서 이 시험은 **회귀 파수꾼이
  //    아니다.** 원하는 동작(초점 유지)을 문서로 남기는 뜻으로 둔다. 실제 파수꾼은 위 ①번.
  it('받는 중이어도 초점을 잃지 않는다 (문서화 목적 — 회귀 파수꾼은 위 disabled 속성 시험)', () => {
    const { rerender } = render(
      <LoadMoreFocusButton id="test-button" hasNextPage isFetchingNextPage={false} onLoadMore={vi.fn()} />
    )
    const 단추 = screen.getByRole('button')
    act(() => {
      단추.focus()
    })
    expect(document.activeElement).toBe(단추)

    // 눌러서 다음 페이지를 받기 시작했다고 가정 — 부르는 쪽이 isFetchingNextPage 를 true 로 올린다
    rerender(<LoadMoreFocusButton id="test-button" hasNextPage isFetchingNextPage onLoadMore={vi.fn()} />)

    expect(document.activeElement).toBe(단추)
  })

  it('받는 중일 때는 눌러도 onLoadMore 를 안 부른다', async () => {
    const 사용자 = userEvent.setup()
    const onLoadMore = vi.fn()
    render(<LoadMoreFocusButton id="test-button" hasNextPage isFetchingNextPage onLoadMore={onLoadMore} />)
    await 사용자.click(screen.getByRole('button'))
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('받는 중이 아닐 때 누르면 onLoadMore 를 한 번 부른다', async () => {
    const 사용자 = userEvent.setup()
    const onLoadMore = vi.fn()
    render(<LoadMoreFocusButton id="test-button" hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />)
    await 사용자.click(screen.getByRole('button'))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('넘긴 id 가 그대로 붙는다 — 짝이 되는 SkipToLoadMoreLink 가 이 값으로 찾아온다', () => {
    render(
      <LoadMoreFocusButton id="home-products-load-more" hasNextPage isFetchingNextPage={false} onLoadMore={vi.fn()} />
    )
    expect(screen.getByRole('button')).toHaveAttribute('id', 'home-products-load-more')
  })
})
