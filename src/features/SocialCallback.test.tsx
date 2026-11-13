import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SocialCallback from './SocialCallback'

// 소셜 로그인 뒤 서버가 /oauth-redirect?accessToken=…&refreshToken=… 으로 돌려보낸다.
// 토큰이 든 주소가 브라우저 방문 기록에 남지 않게, 화면은 토큰을 읽자마자 주소에서 쿼리를 지운다.
//
//   ① 토큰을 읽는다 → ② 주소를 /oauth-redirect 로 바꾼다 → ③ 내 정보를 받아 router.replace 로 이동
//
// ②에서 주소가 바뀌면 searchParams 도 바뀌어 effect 가 다시 돈다. 그때 「토큰 없음」으로 보고
// 로그인 화면으로 보내면 안 된다. 그 조건까지 덮는다.

const replace = vi.fn()
const push = vi.fn()
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, back: vi.fn() }),
  useSearchParams: () => searchParams,
}))

vi.mock('@/lib/api/api', () => ({
  api: { get: vi.fn() },
}))

const { api } = vi.mocked(await import('@/lib/api/api'))

/** 소셜 가입을 마친 회원 (needsSocialSignup 이 false 가 되는 모양) */
const USER = { id: 1, email: 'a@b.com', nickname: '커들', addressSido: '서울특별시', birthDate: '1988-04-03' }

function visit(url: string) {
  window.history.replaceState(null, '', url)
  searchParams = new URLSearchParams(window.location.search)
}

describe('SocialCallback', () => {
  beforeEach(() => {
    replace.mockReset()
    push.mockReset()
    api.get.mockReset()
    api.get.mockResolvedValue({ data: { data: USER } })
  })

  it('토큰을 읽자마자 주소에서 쿼리를 지운다', () => {
    visit('/oauth-redirect?accessToken=AAA&refreshToken=RRR')

    render(<SocialCallback />)

    expect(window.location.pathname).toBe('/oauth-redirect')
    expect(window.location.search).toBe('')
  })

  it('주소가 바뀌어 다시 그려져도 로그인 화면으로 보내지 않고, 이동은 replace 로 한다', async () => {
    visit('/oauth-redirect?accessToken=AAA&refreshToken=RRR')
    const { rerender } = render(<SocialCallback />)

    // 주소를 지운 뒤의 searchParams 로 다시 그린다
    searchParams = new URLSearchParams(window.location.search)
    rerender(<SocialCallback />)

    await waitFor(() => expect(replace).toHaveBeenCalled())
    expect(replace).not.toHaveBeenCalledWith('/auth/login')
    expect(push).not.toHaveBeenCalled()
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('토큰이 없으면 로그인 화면으로 보낸다', () => {
    visit('/oauth-redirect')

    render(<SocialCallback />)

    expect(replace).toHaveBeenCalledWith('/auth/login')
    expect(api.get).not.toHaveBeenCalled()
  })
})
