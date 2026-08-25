import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen, waitFor } from '@/test/render'

import { SocialSignUpForm } from './SocialSignUpForm'

// 가입할 때 필수 동의 둘을 받는가(#1088).
//
// ⚠️ **이 시험의 값어치는 「행복 경로를 끝까지 몬다」는 데 있다.**
//    동의 말고 다른 것이 먼저 막고 있으면, 동의 자물쇠를 통째로 빼도 시험이 그대로
//    통과해 회귀를 못 잡는다. 그래서 ①번 시험에서 **동의만 채우면 서버가 불린다**는
//    것을 먼저 못 박고, 그 다음에 「동의를 빼면 안 불린다」를 잰다.
//
// ⚠️ 단추에 `disabled` 가 붙는가만 보는 시험으로는 **모자란다.** `disabled` 는 화면의
//    일이고 폼은 엔터키로도 프로그램에서도 제출된다. 「서버를 안 불렀는가」가 자물쇠다.
//    (앱 `use-signup-form.test.ts` 의 같은 자리도 그렇게 갈라 두었다)
//
// 일반 가입(SignUpForm)이 아니라 소셜 가입으로 잰 까닭: 일반 가입은 이메일 인증까지
// 통과시켜야 서버에 닿아 준비가 길다. 두 화면은 같은 `ConsentFields` 를 쓰고 자물쇠도
// 같은 모양이라, 짧은 쪽에서 엄밀하게 재고 긴 쪽은 화면만 본다.

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/api/auth', () => ({
  checkNickname: vi.fn(),
}))

vi.mock('@/lib/api/api', () => ({
  api: { patch: vi.fn() },
}))

const { checkNickname } = vi.mocked(await import('@/lib/api/auth'))
const { api } = vi.mocked(await import('@/lib/api/api'))

beforeEach(() => {
  vi.clearAllMocks()
  checkNickname.mockResolvedValue({ data: true, message: '쓸 수 있는 닉네임입니다' } as never)
  api.patch.mockResolvedValue({ data: { data: { id: 1, nickname: '주현' } } } as never)
})

/**
 * 동의를 뺀 나머지를 전부 채운다. 「동의만 모자란」 상태를 만드는 것이 목적이다.
 *
 * ⚠️ 주소(시/도·구/군)까지 골라야 한다. 이 폼은 `CascadingSelectField` 가 둘에
 *    `required` 를 걸어 두어서, 안 고르면 react-hook-form 이 **동의와 상관없이**
 *    제출을 막는다. 그 상태로 재면 자물쇠를 빼도 시험이 통과해 버린다.
 */
async function 동의만빼고전부(사용자: ReturnType<typeof userEvent.setup>) {
  await 사용자.type(screen.getByLabelText(/닉네임/), '주현')
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

describe('소셜 가입 필수 동의 (#1088)', () => {
  it('동의까지 하면 저장 API 가 불린다 — 다른 것이 막고 있지 않다는 증거', async () => {
    const 사용자 = userEvent.setup()
    render(<SocialSignUpForm />)

    await 동의만빼고전부(사용자)
    await 동의둘다(사용자)
    await 사용자.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => expect(api.patch).toHaveBeenCalled())
    expect(api.patch).toHaveBeenCalledWith(
      '/profile/me',
      expect.objectContaining({ termsAgreed: true, privacyAgreed: true }),
    )
  })

  it('동의를 안 하면 저장 API 를 아예 안 부른다', async () => {
    const 사용자 = userEvent.setup()
    const { container } = render(<SocialSignUpForm />)

    await 동의만빼고전부(사용자)

    // 단추가 꺼져 있어 눌러도 안 되므로 **폼을 직접 제출한다** —
    // 엔터키로 제출되는 경우를 흉내 내는 것이다. 이래도 서버가 불리면 안 된다.
    const 폼 = container.querySelector('form')
    expect(폼).not.toBeNull()

    // 단추를 눌러 본다 — 꺼져 있어 아무 일도 안 일어난다
    await 사용자.click(screen.getByRole('button', { name: '회원가입' }))
    // 그리고 **폼을 직접 제출한다.** 엔터키로 제출되는 경우를 흉내 내는 것이다.
    // 단추를 끄는 것만으로는 이 길을 못 막는다.
    폼!.requestSubmit()
    await new Promise((r) => setTimeout(r, 50))

    expect(api.patch).not.toHaveBeenCalled()
  })

  it('하나만 동의해도 안 부른다', async () => {
    const 사용자 = userEvent.setup()
    const { container } = render(<SocialSignUpForm />)

    await 동의만빼고전부(사용자)
    await 사용자.click(screen.getByLabelText(/이용약관에 동의합니다/))

    container.querySelector('form')!.requestSubmit()
    await new Promise((r) => setTimeout(r, 50))

    expect(api.patch).not.toHaveBeenCalled()
  })

  it('동의 전에는 가입 단추에 disabled 가 붙는다', async () => {
    const 사용자 = userEvent.setup()
    render(<SocialSignUpForm />)

    // ⚠️ 「회색이다」가 아니라 **속성이 붙었는가**를 본다. jsdom 은 색을 못 재고,
    //    결과(색)를 보면 회귀를 심어도 통과한다(CLAUDE.md 의 disabled 함정).
    expect(screen.getByRole('button', { name: '회원가입' })).toBeDisabled()

    await 동의둘다(사용자)

    expect(screen.getByRole('button', { name: '회원가입' })).toBeEnabled()
  })

  it('「보기」 링크가 약관·방침으로 간다', () => {
    render(<SocialSignUpForm />)

    expect(screen.getByRole('link', { name: '이용약관 보기' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: '개인정보처리방침 보기' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
