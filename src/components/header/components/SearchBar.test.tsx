import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import SearchBar from './SearchBar'

// 검색창. #788의 set-state-in-effect 3건 중 하나다.
//
// URL의 검색어가 바뀌면 입력칸을 거기에 맞춘다. 이슈가 경고한 것:
//   「뒤로가기 시 입력칸이 안 바뀜」
// 그래서 이 시험의 알맹이는 **URL이 바뀌면 입력칸이 따라오는가**다.

const push = vi.fn()
let currentParams = new URLSearchParams()
let currentPath = '/'

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentParams,
  useRouter: () => ({ push }),
  usePathname: () => currentPath,
}))

beforeEach(() => {
  vi.clearAllMocks()
  currentParams = new URLSearchParams()
  currentPath = '/'
})

describe('URL 검색어 → 입력칸', () => {
  it('처음 열 때 URL의 검색어가 입력칸에 들어 있다', () => {
    currentParams = new URLSearchParams('keyword=캣타워')

    render(<SearchBar />)

    expect(screen.getByRole('textbox')).toHaveValue('캣타워')
  })

  it('URL이 바뀌면 입력칸이 따라온다 (뒤로가기)', () => {
    currentParams = new URLSearchParams('keyword=캣타워')
    const { rerender } = render(<SearchBar />)
    expect(screen.getByRole('textbox')).toHaveValue('캣타워')

    // 뒤로가기로 URL이 바뀐 상황
    currentParams = new URLSearchParams('keyword=사료')
    rerender(<SearchBar />)

    expect(screen.getByRole('textbox')).toHaveValue('사료')
  })

  it('URL에서 검색어가 사라지면 입력칸도 빈다', () => {
    currentParams = new URLSearchParams('keyword=캣타워')
    const { rerender } = render(<SearchBar />)

    currentParams = new URLSearchParams()
    rerender(<SearchBar />)

    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('URL이 그대로면 치던 글자를 안 지운다', async () => {
    currentParams = new URLSearchParams('keyword=캣타워')
    const user = userEvent.setup()
    const { rerender } = render(<SearchBar />)

    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), '고양이 사료')

    // 부모가 다른 이유로 다시 그렸다. URL은 그대로다
    rerender(<SearchBar />)

    expect(screen.getByRole('textbox')).toHaveValue('고양이 사료')
  })

  it('paramName을 바꾸면 그 이름으로 읽는다', () => {
    currentParams = new URLSearchParams('communityKeyword=사료')

    render(<SearchBar paramName="communityKeyword" />)

    expect(screen.getByRole('textbox')).toHaveValue('사료')
  })
})

describe('검색 실행', () => {
  it('홈에서 Enter를 치면 검색 주소로 간다', async () => {
    currentPath = '/'
    const user = userEvent.setup()
    render(<SearchBar />)

    await user.type(screen.getByRole('textbox'), '캣타워{Enter}')

    expect(push).toHaveBeenCalled()
    expect(String(push.mock.calls[0][0])).toContain('keyword=')
  })
})
