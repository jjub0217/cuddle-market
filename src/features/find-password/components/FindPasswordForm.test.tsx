import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FindPasswordForm } from './FindPasswordForm'

// 비밀번호 찾기 3단계. #836에서 「실패해도 다음 단계로 넘어가던 것」을 고쳤다.
//
//   ① 이메일 입력    이메일 칸 + [인증코드 전송]
//   ② 이메일 인증    인증코드 칸 + [재전송] + [인증하기] + [이메일 변경]
//   ③ 비밀번호 재설정 새 비밀번호 칸 둘 + [비밀번호 변경 완료]
//
// 서버가 실제로 메일을 보내므로 진짜 서버로는 시험을 못 한다.
// API를 가짜로 바꿔 **단계를 미는 조건만** 덮는다. signup의 EmailValidCode.test.tsx가 같은 방식이다.

vi.mock('@/lib/api/profile', () => ({
  sendValidCode: vi.fn(),
  checkValidCode: vi.fn(),
  reSettingPassword: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

const { sendValidCode, checkValidCode, reSettingPassword } = vi.mocked(await import('@/lib/api/profile'))

const EMAIL_PLACEHOLDER = '이메일 (example@cuddle.com)'
const CODE_PLACEHOLDER = '6자리 인증코드 입력'
const NEW_PASSWORD_PLACEHOLDER = '10자 이상 입력해주세요(영문 대소문자, 숫자, 특수문자 포함)'
const NEW_PASSWORD_CONFIRM_PLACEHOLDER = '비밀번호를 다시 입력해주세요'

/** 서버가 보내 준 응답 모양 (SuccessResponse) */
const OK = { code: 'SUCCESS', message: '', data: '' }

/** axios가 던지는 모양을 흉내 낸다 — isAxiosError는 이 표식 하나만 본다 */
function serverError(message: string) {
  return { isAxiosError: true, response: { data: { message } } }
}

beforeEach(() => {
  vi.clearAllMocks()
  // 실패 경로마다 console.error를 부른다. 시험 출력이 지저분해지지 않게 막는다.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

/** ②까지 간다 */
async function goToStep2() {
  const user = userEvent.setup()
  sendValidCode.mockResolvedValue(OK)
  render(<FindPasswordForm />)

  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'someone@example.com')
  await user.click(screen.getByRole('button', { name: '인증코드 전송' }))
  await screen.findByPlaceholderText(CODE_PLACEHOLDER)

  return user
}

/** ③까지 간다 */
async function goToStep3() {
  const user = await goToStep2()
  checkValidCode.mockResolvedValue(OK)

  await user.type(screen.getByPlaceholderText(CODE_PLACEHOLDER), '123456')
  await user.click(screen.getByRole('button', { name: '인증하기' }))
  await screen.findByPlaceholderText(NEW_PASSWORD_PLACEHOLDER)

  return user
}

describe('① 이메일 입력', () => {
  it('처음에는 인증코드 칸이 없다', () => {
    render(<FindPasswordForm />)

    expect(screen.getByPlaceholderText(EMAIL_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(CODE_PLACEHOLDER)).not.toBeInTheDocument()
  })

  // #836 증상 ① — 소셜 가입 이메일
  it('소셜 가입 이메일이면 ①에 머물고 실패 사유가 보인다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockRejectedValue(serverError('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.'))
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    // 서버 문구를 그대로 띄우지 않는다 — 사람 말로 다시 쓰고 갈 길을 함께 준다
    expect(await screen.findByText(/카카오 또는 구글로 가입한 계정이에요/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하러 가기' })).toHaveAttribute('href', '/auth/login')
    // 같은 말을 칸 아래에 또 띄우지 않는다
    expect(screen.queryByText('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(CODE_PLACEHOLDER)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '이메일 입력' })).toBeInTheDocument()
  })

  // #836 증상 ② — 탈퇴한 계정
  it('없는 이메일이면 ①에 머물고 실패 사유가 보인다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockRejectedValue(serverError('등록되지 않은 이메일입니다'))
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'gone@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText(/가입된 계정을 찾지 못했어요/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '회원가입하러 가기' })).toHaveAttribute('href', '/auth/signup')
    expect(screen.queryByPlaceholderText(CODE_PLACEHOLDER)).not.toBeInTheDocument()
  })

  it('전송에 성공해야 ②로 넘어간다', async () => {
    await goToStep2()

    expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '이메일 인증' })).toBeInTheDocument()
    expect(screen.getByText('인증 번호를 발송했습니다.')).toBeInTheDocument()
  })
})

describe('② 이메일 인증', () => {
  // #836 증상 ③ — 칸은 ②인데 표시만 ③으로 가던 것
  it('코드가 틀리면 칸도 단계 표시도 ②에 그대로 있다', async () => {
    const user = await goToStep2()
    checkValidCode.mockRejectedValue(serverError('만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.'))

    await user.type(screen.getByPlaceholderText(CODE_PLACEHOLDER), '000000')
    await user.click(screen.getByRole('button', { name: '인증하기' }))

    expect(await screen.findByText('만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toBeInTheDocument()
    // 헤더가 ③('비밀번호 재설정')으로 앞서 나가면 안 된다
    expect(screen.getByRole('heading', { name: '이메일 인증' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '비밀번호 재설정' })).not.toBeInTheDocument()
  })

  it('재전송이 실패해도 ②에 머물고 넣던 코드를 잃지 않는다', async () => {
    const user = await goToStep2()
    await user.type(screen.getByPlaceholderText(CODE_PLACEHOLDER), '123456')

    sendValidCode.mockRejectedValue(serverError('잠시 후 다시 시도해주세요.'))
    await user.click(screen.getByRole('button', { name: '재전송' }))

    expect(await screen.findByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toHaveValue('123456')
  })

  it('재전송에 성공하면 앞서 뜬 오류가 사라진다', async () => {
    const user = await goToStep2()
    checkValidCode.mockRejectedValue(serverError('만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.'))

    await user.type(screen.getByPlaceholderText(CODE_PLACEHOLDER), '000000')
    await user.click(screen.getByRole('button', { name: '인증하기' }))
    await screen.findByText('만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.')

    sendValidCode.mockResolvedValue(OK)
    await user.click(screen.getByRole('button', { name: '재전송' }))

    expect(await screen.findByText('인증 번호를 발송했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('만료된 인증 코드입니다. 인증코드를 재발급 받아주세요.')).not.toBeInTheDocument()
  })

  it('「이메일 변경」을 누르면 ①로 돌아간다', async () => {
    const user = await goToStep2()

    await user.click(screen.getByRole('button', { name: '이메일 변경' }))

    expect(await screen.findByRole('button', { name: '인증코드 전송' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(CODE_PLACEHOLDER)).not.toBeInTheDocument()
    // 앞서 뜬 발송 문구도 같이 지워진다
    expect(screen.queryByText('인증 번호를 발송했습니다.')).not.toBeInTheDocument()
  })

  it('코드가 맞으면 ③으로 넘어간다', async () => {
    const user = await goToStep2()
    checkValidCode.mockResolvedValue(OK)

    await user.type(screen.getByPlaceholderText(CODE_PLACEHOLDER), '123456')
    await user.click(screen.getByRole('button', { name: '인증하기' }))

    expect(await screen.findByRole('button', { name: '비밀번호 변경 완료' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '비밀번호 재설정' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(CODE_PLACEHOLDER)).not.toBeInTheDocument()
  })
})

// #838 — 서버 문구 한 줄로 끝내지 않고 다음에 할 일을 알려 준다.
describe('소셜 계정 안내', () => {
  it('소셜 계정이면 「로그인하러 가기」 길을 함께 준다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockRejectedValue(serverError('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.'))
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText(/카카오 또는 구글로 가입한 계정/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하러 가기' })).toHaveAttribute('href', '/auth/login')
  })

  it('그냥 없는 이메일이면 그 안내는 뜨지 않는다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockRejectedValue(serverError('등록되지 않은 이메일입니다'))
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'gone@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText(/가입된 계정을 찾지 못했어요/)).toBeInTheDocument()
    expect(screen.queryByText(/카카오 또는 구글로 가입한 계정/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '로그인하러 가기' })).not.toBeInTheDocument()
  })

  it('막다른 길이면 인증코드 전송·로그인으로 돌아가기를 숨긴다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockRejectedValue(serverError('카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.'))
    render(<FindPasswordForm />)

    const emailInput = screen.getByPlaceholderText(EMAIL_PLACEHOLDER)
    await user.type(emailInput, 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    // 남는 길은 하나뿐이다
    expect(await screen.findByRole('link', { name: '로그인하러 가기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '인증코드 전송' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '로그인으로 돌아가기' })).not.toBeInTheDocument()

    // 이메일을 고치면 원래대로 돌아온다 — 오타였을 수 있다
    await user.clear(emailInput)
    expect(screen.getByRole('button', { name: '인증코드 전송' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인으로 돌아가기' })).toBeInTheDocument()
  })

  it('서버가 어느 소셜인지 알려주면 콕 집어 말한다', async () => {
    const user = userEvent.setup()
    // 백엔드가 AuthProvider.displayName 을 담아 주는 새 문구
    sendValidCode.mockRejectedValue(serverError('카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.'))
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText(/카카오로 가입한 계정이에요/)).toBeInTheDocument()
    expect(screen.getByText(/비밀번호 대신 카카오 로그인을 이용해주세요/)).toBeInTheDocument()
    // 「또는 구글」로 벌려 쓰지 않는다
    expect(screen.queryByText(/카카오 또는 구글/)).not.toBeInTheDocument()
  })

  it('이메일을 고치면 앞서 뜬 안내가 사라진다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockRejectedValue(serverError('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.'))
    render(<FindPasswordForm />)

    const emailInput = screen.getByPlaceholderText(EMAIL_PLACEHOLDER)
    await user.type(emailInput, 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))
    expect(await screen.findByText(/카카오 또는 구글로 가입한 계정이에요/)).toBeInTheDocument()

    // 값을 고치면 그 값에 대한 판단은 무효다. 안 지우면 화면이 거짓말을 한다 —
    // 다른 이메일을 넣었는데 「소셜 계정이에요」가 그대로 보였다(2026-08-05 신고).
    await user.clear(emailInput)
    expect(screen.queryByText(/카카오 또는 구글로 가입한 계정이에요/)).not.toBeInTheDocument()

    await user.type(emailInput, 'other@example.com')
    expect(screen.queryByText(/카카오 또는 구글로 가입한 계정이에요/)).not.toBeInTheDocument()
  })
})

// #838 — 바꾸고 나서 1.5초 동안 아무 말도 없으면 「눌렀는데 멈췄다」로 보인다.
describe('성공 알림', () => {
  it('비밀번호를 바꾸면 바꿨다고 알린다', async () => {
    const user = await goToStep3()
    reSettingPassword.mockResolvedValue(OK)

    await user.type(screen.getByPlaceholderText(NEW_PASSWORD_PLACEHOLDER), 'Abcdef1!xy')
    await user.type(screen.getByPlaceholderText(NEW_PASSWORD_CONFIRM_PLACEHOLDER), 'Abcdef1!xy')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경 완료' }))

    expect(await screen.findByText(/비밀번호를 바꿨어요/)).toBeInTheDocument()
  })

  it('바꾸기가 실패하면 그 알림은 뜨지 않는다', async () => {
    const user = await goToStep3()
    reSettingPassword.mockRejectedValue(serverError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.'))

    await user.type(screen.getByPlaceholderText(NEW_PASSWORD_PLACEHOLDER), 'Abcdef1!xy')
    await user.type(screen.getByPlaceholderText(NEW_PASSWORD_CONFIRM_PLACEHOLDER), 'Abcdef1!xy')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경 완료' }))

    expect(await screen.findByText('비밀번호 변경에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
    expect(screen.queryByText(/비밀번호를 바꿨어요/)).not.toBeInTheDocument()
  })
})
