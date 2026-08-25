import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'

import { FindAccountForm } from './FindAccountForm'

// **이 화면은 「이 이메일이 회원인가」를 말하면 안 된다**(#849).
//
// 새로 짓는 화면이라 열거 구멍을 **새로 뚫는 것**이 제일 나쁜 결과다. 그래서
// 서버가 낼 수 있는 답을 죄다 넣어 보고 **화면 글자가 하나도 안 달라지는지**를 본다.
//
// ⚠️ 「성공하면 이 문구가 뜬다」만 시험하면 회귀를 못 잡는다. 진짜 회귀는
//    실패 갈래를 늘리는 모양으로 온다 — 404 를 따로 다루거나, 서버 문구를
//    받아 보여주거나. 그래서 **갈래마다 넣어 보고 결과가 같은지**를 본다.

vi.mock('@/lib/api/auth', () => ({ findAccount: vi.fn() }))

const { findAccount } = vi.mocked(await import('@/lib/api/auth'))

const EMAIL_PLACEHOLDER = '이메일 (example@cuddle.com)'
const BUTTON = '안내 메일 받기'

/** axios 가 「서버가 답을 줬다」고 알리는 모양. isAxiosError 는 이 표식 하나만 본다 */
function 서버가답함(status: number, message: string) {
  return { isAxiosError: true, response: { status, data: { message } } }
}

/** axios 가 「서버에 닿지도 못했다」고 알리는 모양 — response 가 없다 */
function 닿지못함() {
  return { isAxiosError: true, request: {}, message: 'Network Error' }
}

beforeEach(() => {
  vi.clearAllMocks()
})

/** 이메일을 넣고 눌러 본 뒤, 결과 박스에 뜬 **모든 글자**를 돌려준다. */
async function 눌러본다(email = 'someone@example.com'): Promise<string> {
  const user = userEvent.setup()
  const { unmount } = render(<FindAccountForm />)

  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), email)
  await user.click(screen.getByRole('button', { name: BUTTON }))

  // 결과가 나오면 「안내 메일 받기」 단추는 사라지고 「로그인하러 가기」가 남는다
  const 결과 = await screen.findByRole('link', { name: '로그인하러 가기' })
  const 글자 = 결과.parentElement?.textContent ?? ''
  unmount()
  return 글자
}

it('서버가 무엇을 답하든 화면 글자가 똑같다', async () => {
  // 서버가 낼 수 있는 답을 죄다 넣어 본다. 위에서 둘은 「회원이다」,
  // 아래 둘은 「회원이 아니다」를 뜻할 수 있는 답이다.
  const 답들 = [
    [200, '안내 메일을 보냈습니다.'],
    [200, '카카오로 가입한 계정입니다.'],
    [400, '등록되지 않은 이메일입니다.'],
    [404, '사용자를 찾을 수 없습니다.'],
    [500, '서버 오류'],
  ] as const

  const 결과들: string[] = []
  for (const [status, message] of 답들) {
    if (status === 200) {
      findAccount.mockResolvedValue(undefined)
    } else {
      findAccount.mockRejectedValue(서버가답함(status, message))
    }
    결과들.push(await 눌러본다())
  }

  // 다섯 갈래가 **모두 같은 글자**여야 한다
  expect(new Set(결과들).size).toBe(1)
  expect(결과들[0]).toContain('가입된 계정이 있다면')
})

it('서버 문구가 화면에 새지 않는다', async () => {
  findAccount.mockRejectedValue(서버가답함(400, '카카오로 가입한 계정입니다.'))
  const user = userEvent.setup()
  render(<FindAccountForm />)

  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'someone@example.com')
  await user.click(screen.getByRole('button', { name: BUTTON }))

  await screen.findByRole('link', { name: '로그인하러 가기' })
  expect(screen.queryByText(/카카오/)).toBeNull()
  expect(screen.queryByText(/등록되지 않은/)).toBeNull()
})

it('넣은 이메일이 달라도 화면이 달라지지 않는다', async () => {
  findAccount.mockResolvedValue(undefined)
  const 회원 = await 눌러본다('member@example.com')

  findAccount.mockRejectedValue(서버가답함(404, '사용자를 찾을 수 없습니다.'))
  const 비회원 = await 눌러본다('nobody@example.com')

  expect(비회원).toBe(회원)
})

it('서버에 닿지도 못하면 그때만 다른 말을 한다', async () => {
  // 이 갈래는 **넣은 이메일과 아무 상관이 없다.** 비행기 모드면 어떤 이메일을
  // 넣어도 이 문구가 나오므로 열거에 쓸 수 없다.
  findAccount.mockRejectedValue(닿지못함())

  const 글자 = await 눌러본다()

  expect(글자).toContain('연결이 되지 않아요')
  expect(글자).not.toContain('가입된 계정이 있다면')
})
