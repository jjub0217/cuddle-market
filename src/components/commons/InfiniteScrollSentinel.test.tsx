import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import InfiniteScrollSentinel from './InfiniteScrollSentinel'

// ⚠️ `vitest.setup.ts` 의 흉내는 **아무것도 안 하는 빈 껍데기**다(observe 가 빈 함수).
//    그래서 「화면에 들어왔다」를 스스로 만들 수 없다. 여기서 갈아 끼워 **콜백을 붙잡았다가
//    직접 쏜다.** 이렇게 해야 「걸리면 다음 페이지를 부른다」를 진짜로 지킬 수 있다.
let 붙잡은콜백: IntersectionObserverCallback | null = null
let 감시한마디수 = 0

beforeEach(() => {
  붙잡은콜백 = null
  감시한마디수 = 0
  window.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    constructor(cb: IntersectionObserverCallback) {
      붙잡은콜백 = cb
    }
    observe() {
      감시한마디수 += 1
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  } as unknown as typeof IntersectionObserver
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** 깃발이 화면에 들어온 척한다. */
function 깃발이보이게하자() {
  act(() => {
    붙잡은콜백?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

describe('InfiniteScrollSentinel', () => {
  it('깃발이 보이면 다음 페이지를 부른다', () => {
    const onLoadMore = vi.fn()
    render(
      <InfiniteScrollSentinel id="test-load-more" enabled hasNextPage isFetchingNextPage={false} onLoadMore={onLoadMore} />
    )
    깃발이보이게하자()
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('다음 페이지가 없으면 안 부른다', () => {
    const onLoadMore = vi.fn()
    render(
      <InfiniteScrollSentinel id="test-load-more" enabled hasNextPage={false} isFetchingNextPage={false} onLoadMore={onLoadMore} />
    )
    깃발이보이게하자()
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('이미 받는 중이면 또 부르지 않는다', () => {
    const onLoadMore = vi.fn()
    render(<InfiniteScrollSentinel id="test-load-more" enabled hasNextPage isFetchingNextPage onLoadMore={onLoadMore} />)
    깃발이보이게하자()
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  // ⚠️ 목록이 아직 비었을 때 감시를 켜면 첫 그림에서 바로 걸려 **두 번 부른다.**
  //    그래서 부르는 쪽이 `products.length > 0` 을 넘긴다.
  it('enabled 가 아니면 감시를 아예 안 건다', () => {
    const onLoadMore = vi.fn()
    render(
      <InfiniteScrollSentinel
        id="test-load-more"
        enabled={false}
        hasNextPage
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
      />
    )
    expect(감시한마디수).toBe(0)
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  // ⚠️ `getByText` 로 찾지 마라. 「더 불러오는 중」이 **두 마디에 있다** — `Spinner` 안의
  //    낱말용 글자와, 눈에 보이는 글자. 낭독기가 두 번 읽지 않게 보이는 쪽에 `aria-hidden` 을
  //    줬으므로, 낭독기가 읽는 것은 `role="status"` 하나다. 그것으로 확인한다.
  it('받는 중일 때만 「더 불러오는 중」을 보여준다', () => {
    const { rerender } = render(
      <InfiniteScrollSentinel id="test-load-more" enabled hasNextPage isFetchingNextPage={false} onLoadMore={vi.fn()} />
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    rerender(<InfiniteScrollSentinel id="test-load-more" enabled hasNextPage isFetchingNextPage onLoadMore={vi.fn()} />)
    expect(screen.getByRole('status', { name: '더 불러오는 중' })).toBeInTheDocument()
  })

  it('낭독기가 「더 불러오는 중」을 두 번 읽지 않는다', () => {
    render(<InfiniteScrollSentinel id="test-load-more" enabled hasNextPage isFetchingNextPage onLoadMore={vi.fn()} />)
    const 보이는글자 = screen.getAllByText('더 불러오는 중').filter((el) => el.getAttribute('aria-hidden') === 'true')
    expect(보이는글자).toHaveLength(1)
  })

  // ⚠️ 다 받은 뒤에도 깃발 마디는 남는다. 없애면 나중에 목록이 늘었을 때 붙일 자리가 없다.
  it('다음 페이지가 없어도 깃발 마디는 남아 있는다', () => {
    const { container } = render(
      <InfiniteScrollSentinel
        id="test-load-more"
        enabled
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
      />
    )
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
