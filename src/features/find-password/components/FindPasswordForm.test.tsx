import { act, render, screen } from '@testing-library/react'
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
  // ⚠️ **아래 둘은 #849 2단계에서 뒤집힌 시험이다.** 예전에는 「소셜이면 ①에 머물고
  //    사유가 보인다」를 지켰는데, 그 사유가 보이는 것이 곧 계정 열거였다 —
  //    남의 이메일을 넣어 본 사람도 「이 사람은 카카오로 가입했다」를 알게 된다.
  //    이제 서버가 셋 모두에 200 을 주므로 지켜야 할 것이 반대가 됐다.

  it('소셜 가입 이메일이어도 다른 사람과 똑같이 ②로 간다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockResolvedValue(OK)
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByPlaceholderText(CODE_PLACEHOLDER)).toBeInTheDocument()
    // 어느 소셜인지 화면이 말하지 않는다 — 그 말이 곧 열거 통로였다
    expect(screen.queryByText(/카카오/)).not.toBeInTheDocument()
    expect(screen.queryByText(/구글/)).not.toBeInTheDocument()
  })

  it('가입되지 않은 이메일이어도 똑같이 ②로 간다', async () => {
    const user = userEvent.setup()
    sendValidCode.mockResolvedValue(OK)
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'nobody@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByPlaceholderText(CODE_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.queryByText(/가입된 계정을 찾지 못했어요/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '회원가입하러 가기' })).not.toBeInTheDocument()
  })

  it('전송에 성공해야 ②로 넘어간다', async () => {
    await goToStep2()

    expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '이메일 인증' })).toBeInTheDocument()
    // 전송 성공은 헤더가 말한다. 칸 아래에 또 띄우면 같은 말이 두 줄이 된다
    // ⚠️ 「인증코드를 발송했습니다」가 아니다(#849). 여기 오는 사람 중에는 인증코드가
    //    아니라 가입 방법 안내를 받는 사람도, 아무것도 못 받는 사람도 섞여 있다.
    expect(screen.getByText(/안내 메일을 보냈습니다/)).toBeInTheDocument()
    expect(screen.getByText(/메일이 오지 않으면 가입 방법이 다를 수 있어요/)).toBeInTheDocument()
    expect(screen.queryByText('인증 번호를 발송했습니다.')).not.toBeInTheDocument()
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

    // ⚠️ 서버가 갈라 말하는 문구를 일부러 넣는다 — 재전송 경로로도 새지 않는지 본다(#849)
    sendValidCode.mockRejectedValue(serverError('카카오로 가입한 계정입니다.'))
    await user.click(screen.getByRole('button', { name: '재전송' }))

    expect(await screen.findByText('인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.')).toBeInTheDocument()
    expect(screen.queryByText(/카카오/)).not.toBeInTheDocument()
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

    expect(await screen.findByText(/안내 메일을 보냈습니다/)).toBeInTheDocument()
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
describe('인증코드 만료 시간', () => {
  it('코드를 보내면 4:59부터 줄어든다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    sendValidCode.mockResolvedValue(OK)
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'me@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText(/남은 시간 4:59/)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText(/남은 시간 4:57/)).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('시간이 다 되면 ①로 돌아가고 이유를 알린다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    sendValidCode.mockResolvedValue(OK)
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'me@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))
    expect(await screen.findByPlaceholderText(CODE_PLACEHOLDER)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(300_000)
    })

    // 만료된 코드를 계속 넣게 두지 않는다
    expect(screen.queryByPlaceholderText(CODE_PLACEHOLDER)).not.toBeInTheDocument()
    expect(screen.getByText('인증 시간이 지났어요. 다시 받아주세요.')).toBeInTheDocument()

    vi.useRealTimers()
  })
})

// ⚠️ **예전의 「소셜 계정 안내」 묶음(다섯 시험)을 통째로 지웠다**(#849 2단계).
//    그 다섯은 「막다른 길 박스가 뜨는가」·「어느 소셜인지 콕 집어 말하는가」를 지켰는데,
//    그것이 바로 계정 열거였다. 지금은 그 박스 자체가 없다.
//
//    ⚠️ **친절이 사라진 게 아니라 메일로 옮겨 갔다.** 소셜로 가입한 사람에게는
//       「카카오로 가입되어 있어요」가 메일로 간다. 그 확인은 서버 몫이라 여기서 못 한다.
describe('계정 열거 차단', () => {
  it('서버가 갈라 말해도 화면은 그 문구를 옮기지 않는다', async () => {
    const user = userEvent.setup()
    // 아직 안 배포된 옛 서버가 400 으로 갈라 말하는 상황
    sendValidCode.mockRejectedValue(serverError('카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.'))
    render(<FindPasswordForm />)

    await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'kakao@example.com')
    await user.click(screen.getByRole('button', { name: '인증코드 전송' }))

    // ⚠️ 「결과」가 아니라 「원인」을 본다 — 서버 문구가 화면 어디에도 나오면 안 된다
    expect(await screen.findByRole('heading', { name: '이메일 입력' })).toBeInTheDocument()
    expect(screen.queryByText(/카카오/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '로그인하러 가기' })).not.toBeInTheDocument()
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
