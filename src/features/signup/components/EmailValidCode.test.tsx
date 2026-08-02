import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmailValidCode } from './EmailValidCode'
import type { SignUpFormValues } from './SignUpForm'

// 이메일 인증 3상태. #798에서 크게 고쳤는데 자동으로 확인할 수단이 없어 전부 손으로만 봤다.
//
//   ① idle      이메일 칸 + [인증받기]
//   ② sent      이메일 칸(잠김) + [재발송] + 인증코드 칸 + [확인] + 남은 시간
//   ③ verified  이메일 칸(잠김) + ✓ 인증 완료 + [이메일 변경]
//
// 인증코드가 실제 메일로 오므로 서버를 부르는 시험은 못 한다.
// API를 가짜로 바꿔 **화면 로직만** 덮는다. 앱의 use-signup-form.test.ts가 같은 방식이다.

vi.mock('@/lib/api/auth', () => ({
  checkEmail: vi.fn(),
  sendEmailValidCode: vi.fn(),
  checkEmailValidCode: vi.fn(),
}))

const { checkEmail, sendEmailValidCode, checkEmailValidCode } = vi.mocked(
  await import('@/lib/api/auth')
)

/**
 * 이 조각은 react-hook-form의 손잡이를 통째로 받는다.
 * 그래서 시험에서도 진짜 폼을 만들어 넘긴다 — 가짜로 흉내 내면 실제와 어긋난다.
 */
function Harness() {
  const { register, control, formState, setValue, clearErrors } = useForm<SignUpFormValues>({
    defaultValues: { email: '', emailCode: '' } as SignUpFormValues,
  })

  return (
    <EmailValidCode
      register={register}
      control={control}
      errors={formState.errors}
      setValue={setValue}
      clearErrors={clearErrors}
      setIsEmailVerified={vi.fn()}
      setIsEmailCodeVerified={vi.fn()}
    />
  )
}

/**
 * 서버가 「쓸 수 있는 이메일」이라고 답한 것.
 * checkEmail만 data가 boolean이다 (SuccessResponse<Boolean>).
 */
const AVAILABLE = { code: 'SUCCESS', message: '', data: true }

/** 인증코드 발송·확인 응답. 이쪽은 data가 문자열이다 (SuccessResponse<String>) */
const CODE_OK = { code: 'SUCCESS', message: '', data: '' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('① idle', () => {
  it('처음에는 인증코드 칸이 없다', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: '인증받기' })).toBeInTheDocument()
    // 코드를 보내기 전에는 넣을 코드가 없다
    expect(screen.queryByPlaceholderText('전송된 코드를 입력해주세요')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이메일 변경' })).not.toBeInTheDocument()
  })

  it('이메일이 비어 있으면 서버를 안 부른다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: '인증받기' }))

    expect(await screen.findByText('이메일을 입력해주세요.')).toBeInTheDocument()
    expect(checkEmail).not.toHaveBeenCalled()
  })

  it('이메일 모양이 틀리면 서버를 안 부른다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText(/이메일/), 'not-an-email')
    await user.click(screen.getByRole('button', { name: '인증받기' }))

    expect(await screen.findByText('올바른 이메일 형식을 입력해주세요.')).toBeInTheDocument()
    expect(checkEmail).not.toHaveBeenCalled()
  })

  it('이미 가입된 이메일이면 다음으로 안 넘어간다', async () => {
    const user = userEvent.setup()
    checkEmail.mockResolvedValue({
      code: 'SUCCESS',
      message: '이미 가입된 이메일이에요.',
      data: false,
    })
    render(<Harness />)

    await user.type(screen.getByLabelText(/이메일/), 'taken@example.com')
    await user.click(screen.getByRole('button', { name: '인증받기' }))

    expect(await screen.findByText('이미 가입된 이메일이에요.')).toBeInTheDocument()
    // 코드를 안 보냈으니 ②로 안 간다
    expect(sendEmailValidCode).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('전송된 코드를 입력해주세요')).not.toBeInTheDocument()
  })
})

describe('② sent', () => {
  async function goToSent() {
    const user = userEvent.setup()
    checkEmail.mockResolvedValue(AVAILABLE)
    sendEmailValidCode.mockResolvedValue(CODE_OK)
    render(<Harness />)

    await user.type(screen.getByLabelText(/이메일/), 'new@example.com')
    await user.click(screen.getByRole('button', { name: '인증받기' }))
    await screen.findByPlaceholderText('전송된 코드를 입력해주세요')

    return user
  }

  it('코드를 보내면 인증코드 칸과 남은 시간이 나타난다', async () => {
    await goToSent()

    expect(screen.getByPlaceholderText('전송된 코드를 입력해주세요')).toBeInTheDocument()
    // 화면에 4:59부터 보이게 한다 (CODE_TTL_SECONDS - 1)
    expect(screen.getByText(/남은 시간 4:59/)).toBeInTheDocument()
  })

  it('이메일 칸이 잠긴다', async () => {
    await goToSent()

    expect(screen.getByLabelText(/이메일/)).toHaveAttribute('readonly')
  })

  it('재발송과 이메일 변경이 생긴다', async () => {
    await goToSent()

    expect(screen.getByRole('button', { name: '재발송' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이메일 변경' })).toBeInTheDocument()
    // 처음 상태의 단추는 사라진다
    expect(screen.queryByRole('button', { name: '인증받기' })).not.toBeInTheDocument()
  })

  it('「이메일 변경」을 누르면 ①로 돌아간다', async () => {
    const user = await goToSent()

    await user.click(screen.getByRole('button', { name: '이메일 변경' }))

    expect(await screen.findByRole('button', { name: '인증받기' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('전송된 코드를 입력해주세요')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/이메일/)).not.toHaveAttribute('readonly')
  })

  it('코드가 틀리면 ②에 그대로 머문다', async () => {
    const user = await goToSent()
    checkEmailValidCode.mockRejectedValue(new Error('틀림'))

    await user.type(screen.getByPlaceholderText('전송된 코드를 입력해주세요'), '000000')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByText(/네트워크 오류가 발생했습니다/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('전송된 코드를 입력해주세요')).toBeInTheDocument()
  })
})

describe('③ verified', () => {
  async function goToVerified() {
    const user = userEvent.setup()
    checkEmail.mockResolvedValue(AVAILABLE)
    sendEmailValidCode.mockResolvedValue(CODE_OK)
    checkEmailValidCode.mockResolvedValue(CODE_OK)
    render(<Harness />)

    await user.type(screen.getByLabelText(/이메일/), 'new@example.com')
    await user.click(screen.getByRole('button', { name: '인증받기' }))

    const codeInput = await screen.findByPlaceholderText('전송된 코드를 입력해주세요')
    await user.type(codeInput, '123456')
    await user.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('전송된 코드를 입력해주세요')).not.toBeInTheDocument()
    })

    return user
  }

  it('인증이 끝나면 코드 칸과 타이머가 사라진다', async () => {
    await goToVerified()

    expect(screen.queryByPlaceholderText('전송된 코드를 입력해주세요')).not.toBeInTheDocument()
    expect(screen.queryByText(/남은 시간/)).not.toBeInTheDocument()
  })

  it('완료 문구가 뜨고 이메일 칸은 잠긴 채다', async () => {
    await goToVerified()

    expect(screen.getByText('✓ 이메일 인증이 완료되었어요.')).toBeInTheDocument()
    expect(screen.getByLabelText(/이메일/)).toHaveAttribute('readonly')
  })

  it('재발송 단추가 사라진다', async () => {
    await goToVerified()

    // 인증이 끝난 뒤 재발송하면 서버가 기존 인증 기록을 지워 가입이 막힌다.
    // 그래서 단추 자체를 없앤다.
    expect(screen.queryByRole('button', { name: '재발송' })).not.toBeInTheDocument()
  })

  it('「이메일 변경」으로는 ①로 돌아갈 수 있다', async () => {
    const user = await goToVerified()

    await user.click(screen.getByRole('button', { name: '이메일 변경' }))

    expect(await screen.findByRole('button', { name: '인증받기' })).toBeInTheDocument()
  })
})

describe('타이머', () => {
  it('남은 시간이 0이 되면 ①로 돌아간다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    checkEmail.mockResolvedValue(AVAILABLE)
    sendEmailValidCode.mockResolvedValue(CODE_OK)
    render(<Harness />)

    await user.type(screen.getByLabelText(/이메일/), 'new@example.com')
    await user.click(screen.getByRole('button', { name: '인증받기' }))
    await screen.findByPlaceholderText('전송된 코드를 입력해주세요')

    // 4:59에서 시작하므로 299초를 흘려보낸다
    await vi.advanceTimersByTimeAsync(299_000)

    expect(await screen.findByText('인증 시간이 지났어요. 다시 받아주세요.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('전송된 코드를 입력해주세요')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '인증받기' })).toBeInTheDocument()

    vi.useRealTimers()
  })
})
