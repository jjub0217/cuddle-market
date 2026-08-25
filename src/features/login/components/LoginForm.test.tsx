import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'

import { LoginForm } from './LoginForm'

// **계정 열거를 막는 줄을 지킨다**(#849).
//
// 로그인 화면은 「이 이메일이 회원인가」·「어떤 방법으로 가입했나」를 말하면 안 된다.
// 남의 이메일을 넣어 볼 수 있는 사람이면 누구나 그걸 알아낼 수 있게 되기 때문이다.
//
// ⚠️ **「문구가 이렇다」로 시험하면 회귀를 못 잡는다.** 진짜 회귀는 이런 모양으로 온다.
//
//     setError('root', { message: error.response?.data?.message })   ← 서버 문구를 그대로
//
//    이 저장소의 다른 화면들이 실제로 그렇게 쓴다(FindPasswordForm·SignUpForm). 그래서
//    여기서는 **서버 문구를 서로 다르게 두 번 주고, 화면 글이 그대로인지**를 본다 —
//    「원인(서버 문구를 쓰는가)」을 직접 보는 자리다.
//
// 서버는 로그인 실패를 **둘 다 같은 문구**로 답한다(AuthServiceImpl.java:127·131).
// 하지만 그건 서버 사정이고, 화면이 서버 문구에 기대기 시작하면 서버가 언젠가
// 갈라 말하는 순간 화면도 같이 샌다. 여기서 끊어 둔다.

vi.mock('@/lib/api/auth', () => ({ login: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

const { login } = vi.mocked(await import('@/lib/api/auth'))

const EMAIL_PLACEHOLDER = '이메일 (example@cuddle.com)'
const PASSWORD_PLACEHOLDER = '비밀번호 (10~30자의 영문 대소문자, 숫자, 특수문자 포함)'

/** 검증 규칙(authValidationRules.password)을 통과하는 값. 안 그러면 제출 자체가 막힌다. */
const VALID_PASSWORD = 'Abcdefg1!x'

/** axios가 던지는 모양을 흉내 낸다 — isAxiosError는 이 표식 하나만 본다 */
function serverError(message: string) {
  return { isAxiosError: true, response: { status: 400, data: { message } } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

/** 로그인을 한 번 시도하고, 화면에 뜬 오류 글을 돌려준다. */
async function 로그인해본다(serverMessage: string): Promise<string> {
  login.mockRejectedValue(serverError(serverMessage))
  const user = userEvent.setup()
  const { unmount } = render(<LoginForm />)

  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'someone@example.com')
  await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), VALID_PASSWORD)
  await user.click(screen.getByRole('button', { name: '로그인' }))

  const 문구 = (await screen.findByText(/일치하지 않습니다/)).textContent ?? ''
  unmount()
  return 문구
}

it('서버가 가입 방법을 알려줘도 화면 문구는 달라지지 않는다', async () => {
  // 왼쪽은 서버가 지금 주는 문구, 오른쪽은 **서버가 갈라 말하기 시작했을 때** 올 문구다
  // (비밀번호 찾기 쪽은 이미 저렇게 답한다 — AuthServiceImpl.java:199).
  const 보통 = await 로그인해본다('이메일 또는 비밀번호가 일치하지 않습니다.')
  const 소셜 = await 로그인해본다('카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.')

  expect(소셜).toBe(보통)
})

it('서버 문구에 담긴 소셜 이름이 화면에 새지 않는다', async () => {
  login.mockRejectedValue(serverError('카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.'))
  const user = userEvent.setup()
  render(<LoginForm />)

  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'someone@example.com')
  await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), VALID_PASSWORD)
  await user.click(screen.getByRole('button', { name: '로그인' }))

  await screen.findByText(/일치하지 않습니다/)
  // 「소셜로 가입하셨다면…」은 **누구에게나** 뜨는 안내라 괜찮다. 「카카오」처럼
  // 그 계정을 콕 집는 말이 뜨면 안 된다.
  expect(screen.queryByText(/카카오/)).toBeNull()
})

it('가입되지 않은 이메일이라고 서버가 답해도 그 사실을 화면이 말하지 않는다', async () => {
  login.mockRejectedValue(serverError('등록되지 않은 이메일입니다.'))
  const user = userEvent.setup()
  render(<LoginForm />)

  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'nobody@example.com')
  await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), VALID_PASSWORD)
  await user.click(screen.getByRole('button', { name: '로그인' }))

  await screen.findByText(/일치하지 않습니다/)
  expect(screen.queryByText(/등록되지 않은/)).toBeNull()
})
