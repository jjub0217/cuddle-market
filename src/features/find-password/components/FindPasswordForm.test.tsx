import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FindPasswordForm } from './FindPasswordForm'

// 비밀번호 찾기 3단계. #836에서 「실패해도 다음 단계로 넘어가던 것」을 고쳤다.
//
//   ① 이메일 입력    이메일 칸 + [인증코드 전송]
//   ② 이메일 인증    인증코드 칸 + [재전송] + [인증하기] + [이전단계]
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

const { sendValidCode, checkValidCode } = vi.mocked(await import('@/lib/api/profile'))

const EMAIL_PLACEHOLDER = '이메일 (example@cuddle.com)'
const CODE_PLACEHOLDER = '6자리 인증코드 입력'

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

    expect(await screen.findByText('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.')).toBeInTheDocument()
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

    expect(await screen.findByText('등록되지 않은 이메일입니다')).toBeInTheDocument()
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

  it('「이전단계」를 누르면 ①로 돌아간다', async () => {
    const user = await goToStep2()

    await user.click(screen.getByRole('button', { name: '이전단계' }))

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
