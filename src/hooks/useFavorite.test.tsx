import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFavorite } from './useFavorite'

// 찜 하트. #788의 set-state-in-effect 3건 중 하나다.
//
// initialIsFavorite(prop)이 바뀌면 안쪽 state를 맞춰야 한다. 고칠 때 깨지기 쉬운 것:
//   ① 목록을 새로 받아 initialIsFavorite이 바뀌었는데 하트가 안 따라간다
//   ② 하트를 눌렀을 때 바로 안 바뀐다 (낙관적 갱신)
//   ③ 실패했을 때 원래대로 안 돌아간다

vi.mock('@/lib/api/graphql', () => ({ fetchGraphQL: vi.fn() }))

const mockUserStore = { isLogin: vi.fn(() => true), setRedirectUrl: vi.fn() }
const mockModalStore = { openLoginModal: vi.fn() }

vi.mock('@/store/userStore', () => ({
  useUserStore: () => mockUserStore,
}))
vi.mock('@/store/modalStore', () => ({
  useLoginModalStore: () => mockModalStore,
}))

const { fetchGraphQL } = vi.mocked(await import('@/lib/api/graphql'))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUserStore.isLogin.mockReturnValue(true)
})

describe('처음 값', () => {
  it('initialIsFavorite을 그대로 쓴다', () => {
    const { result } = renderHook(() => useFavorite({ productId: 1, initialIsFavorite: true }), {
      wrapper,
    })

    expect(result.current.isFavorite).toBe(true)
  })
})

describe('prop이 바뀌면 따라간다', () => {
  it('false → true로 바뀌면 하트가 켜진다', () => {
    const { result, rerender } = renderHook(
      ({ initialIsFavorite }) => useFavorite({ productId: 1, initialIsFavorite }),
      { wrapper, initialProps: { initialIsFavorite: false } }
    )

    expect(result.current.isFavorite).toBe(false)

    // 목록을 새로 받아 서버 값이 바뀐 상황
    rerender({ initialIsFavorite: true })

    expect(result.current.isFavorite).toBe(true)
  })

  it('true → false로 바뀌면 하트가 꺼진다', () => {
    const { result, rerender } = renderHook(
      ({ initialIsFavorite }) => useFavorite({ productId: 1, initialIsFavorite }),
      { wrapper, initialProps: { initialIsFavorite: true } }
    )

    rerender({ initialIsFavorite: false })

    expect(result.current.isFavorite).toBe(false)
  })

  it('같은 값으로 다시 그려도 눌러 둔 하트를 안 되돌린다', async () => {
    fetchGraphQL.mockResolvedValue({})
    const { result, rerender } = renderHook(
      ({ initialIsFavorite }) => useFavorite({ productId: 1, initialIsFavorite }),
      { wrapper, initialProps: { initialIsFavorite: false } }
    )

    act(() => result.current.handleToggleFavorite())
    await waitFor(() => expect(result.current.isFavorite).toBe(true))

    // 부모가 다른 이유로 다시 그렸다. prop 값은 그대로다
    rerender({ initialIsFavorite: false })

    // 방금 누른 것이 살아 있어야 한다
    expect(result.current.isFavorite).toBe(true)
  })
})

describe('누를 때', () => {
  it('바로 뒤집힌다 (서버 응답을 안 기다린다)', async () => {
    fetchGraphQL.mockImplementation(() => new Promise(() => {})) // 영원히 안 끝남
    const { result } = renderHook(() => useFavorite({ productId: 1, initialIsFavorite: false }), {
      wrapper,
    })

    act(() => result.current.handleToggleFavorite())

    await waitFor(() => expect(result.current.isFavorite).toBe(true))
  })

  it('실패하면 원래대로 돌아간다', async () => {
    fetchGraphQL.mockRejectedValue(new Error('실패'))
    const { result } = renderHook(() => useFavorite({ productId: 1, initialIsFavorite: false }), {
      wrapper,
    })

    act(() => result.current.handleToggleFavorite())

    await waitFor(() => expect(result.current.isFavorite).toBe(false))
  })

  it('로그인 안 했으면 로그인 창을 열고 서버를 안 부른다', () => {
    mockUserStore.isLogin.mockReturnValue(false)
    const { result } = renderHook(() => useFavorite({ productId: 1, initialIsFavorite: false }), {
      wrapper,
    })

    act(() => result.current.handleToggleFavorite())

    expect(mockModalStore.openLoginModal).toHaveBeenCalled()
    expect(fetchGraphQL).not.toHaveBeenCalled()
    expect(result.current.isFavorite).toBe(false)
  })
})
