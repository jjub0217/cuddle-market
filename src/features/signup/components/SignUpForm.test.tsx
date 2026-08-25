import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen, waitFor } from '@/test/render'

import { SignUpForm } from './SignUpForm'

// 일반 가입에서 필수 동의 둘을 받는가(#1088).
//
// ⚠️ **행복 경로를 끝까지 몬다.** 이메일 인증·닉네임 중복체크·생년월일·주소까지 다 채워서
//    「동의만 모자란」 상태를 만든다. 다른 것이 먼저 막고 있는 채로 재면, 동의 자물쇠를
//    통째로 빼도 시험이 그대로 통과해 **회귀를 못 잡는다.**
//    그래서 ①번 시험이 「동의까지 하면 가입 API 가 불린다」를 먼저 못 박는다.
//
// ⚠️ 단추에 `disabled` 가 붙는가만으로는 모자란다 — `disabled` 는 화면의 일이고 폼은
//    엔터키로도 제출된다. **「가입 API 를 안 불렀는가」가 진짜 자물쇠다.**
//    실제로 자물쇠를 빼 보면 `disabled` 시험은 그대로 통과하고 이쪽만 빨개진다.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/api/auth', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  checkEmail: vi.fn(),
  sendEmailValidCode: vi.fn(),
  checkEmailValidCode: vi.fn(),
  checkNickname: vi.fn(),
}))

const { signup, login, checkEmail, sendEmailValidCode, checkEmailValidCode, checkNickname } =
  vi.mocked(await import('@/lib/api/auth'))

beforeEach(() => {
  vi.clearAllMocks()
  checkEmail.mockResolvedValue({ data: true, message: '' } as never)
  sendEmailValidCode.mockResolvedValue(undefined as never)
  checkEmailValidCode.mockResolvedValue(undefined as never)
  checkNickname.mockResolvedValue({ data: true, message: '쓸 수 있는 닉네임입니다' } as never)
  signup.mockResolvedValue({} as never)
  login.mockResolvedValue({
    data: { user: { id: 1 }, accessToken: 'a', refreshToken: 'r' },
  } as never)
})

/**
 * 동의를 뺀 나머지를 전부 채운다.
 *
 * 주소(시/도·구/군)까지 골라야 한다 — `CascadingSelectField` 가 둘에 `required` 를 걸어
 * 두어서, 안 고르면 동의와 상관없이 react-hook-form 이 제출을 막는다.
 */
async function 동의만빼고전부(사용자: ReturnType<typeof userEvent.setup>) {
  await 사용자.type(screen.getByPlaceholderText('example@gmail.com'), 'me@cuddle.com')
  await 사용자.click(screen.getByRole('button', { name: '인증받기' }))
  await waitFor(() => expect(sendEmailValidCode).toHaveBeenCalled())

  await 사용자.type(screen.getByPlaceholderText('전송된 코드를 입력해주세요'), '123456')
  await 사용자.click(screen.getByRole('button', { name: '확인' }))
  await waitFor(() => expect(checkEmailValidCode).toHaveBeenCalled())

  await 사용자.type(screen.getByPlaceholderText('비밀번호를 입력해주세요'), 'Abcdef1!xy')
  await 사용자.type(screen.getByPlaceholderText('비밀번호를 다시 입력해주세요'), 'Abcdef1!xy')
  await 사용자.type(screen.getByPlaceholderText('이름을 입력해주세요'), '강주현')

  await 사용자.type(screen.getByPlaceholderText('닉네임을 입력해주세요'), '주현')
  await 사용자.click(screen.getByRole('button', { name: '중복체크' }))
  await waitFor(() => expect(checkNickname).toHaveBeenCalled())

  await 사용자.type(screen.getByLabelText('생년월일 년도'), '2000')
  await 사용자.type(screen.getByLabelText('생년월일 월'), '03')
  await 사용자.type(screen.getByLabelText('생년월일 일'), '07')

  await 사용자.click(screen.getByRole('combobox', { name: '시/도를 선택해주세요' }))
  await 사용자.click(screen.getByRole('option', { name: '서울특별시' }))
  await 사용자.click(screen.getByRole('combobox', { name: '시/군/구 를 선택해주세요' }))
  await 사용자.click(screen.getByRole('option', { name: '강남구' }))
}

async function 동의둘다(사용자: ReturnType<typeof userEvent.setup>) {
  await 사용자.click(screen.getByLabelText(/이용약관에 동의합니다/))
  await 사용자.click(screen.getByLabelText(/개인정보처리방침에 동의합니다/))
}

describe('일반 가입 필수 동의 (#1088)', () => {
  it('동의까지 하면 가입 API 가 불린다 — 다른 것이 막고 있지 않다는 증거', async () => {
    const 사용자 = userEvent.setup()
    render(<SignUpForm />)

    await 동의만빼고전부(사용자)
    await 동의둘다(사용자)
    await 사용자.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => expect(signup).toHaveBeenCalled())
    expect(signup).toHaveBeenCalledWith(
      expect.objectContaining({ termsAgreed: true, privacyAgreed: true }),
    )
  })

  it('동의를 안 하면 가입 API 를 아예 안 부른다', async () => {
    const 사용자 = userEvent.setup()
    const { container } = render(<SignUpForm />)

    await 동의만빼고전부(사용자)

    // 단추를 눌러 본다 — 꺼져 있어 아무 일도 안 일어난다
    await 사용자.click(screen.getByRole('button', { name: '회원가입' }))
    // 그리고 **폼을 직접 제출한다.** 엔터키로 제출되는 길을 흉내 내는 것이다.
    container.querySelector('form')!.requestSubmit()
    await new Promise((r) => setTimeout(r, 50))

    expect(signup).not.toHaveBeenCalled()
  })

  it('하나만 동의해도 안 부른다', async () => {
    const 사용자 = userEvent.setup()
    const { container } = render(<SignUpForm />)

    await 동의만빼고전부(사용자)
    await 사용자.click(screen.getByLabelText(/개인정보처리방침에 동의합니다/))

    container.querySelector('form')!.requestSubmit()
    await new Promise((r) => setTimeout(r, 50))

    expect(signup).not.toHaveBeenCalled()
  })

  it('동의 전에는 가입 단추에 disabled 가 붙는다', async () => {
    const 사용자 = userEvent.setup()
    render(<SignUpForm />)

    // ⚠️ 「회색이다」가 아니라 **속성이 붙었는가**를 본다. jsdom 은 색을 못 잰다.
    expect(screen.getByRole('button', { name: '회원가입' })).toBeDisabled()

    await 동의둘다(사용자)

    expect(screen.getByRole('button', { name: '회원가입' })).toBeEnabled()
  })

  it('「보기」 링크가 약관·방침으로 간다', () => {
    render(<SignUpForm />)

    expect(screen.getByRole('link', { name: '이용약관 보기' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: '개인정보처리방침 보기' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
