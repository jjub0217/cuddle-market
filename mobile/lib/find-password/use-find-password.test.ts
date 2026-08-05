// 서버 호출 셋만 가짜로 바꾸고 PasswordResetRejectedError 는 진짜를 쓴다.
// 통째로 automock 하면 오류 클래스 생성자까지 빈 껍데기가 되어 reason·message 가 사라진다.
jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  sendResetCode: jest.fn(),
  verifyResetCode: jest.fn(),
  resetPassword: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react-native';

import * as api from './api';
import { useFindPassword } from './use-find-password';

const mockedApi = api as jest.Mocked<typeof api>;

type Form = ReturnType<typeof useFindPassword>;

/** 1단계를 통과시켜 2단계로 보낸다. 여러 시험이 같은 준비를 쓴다. */
async function reachStep2(result: { current: Form }) {
  await act(async () => result.current.setValue('email', 'me@cuddle.com'));
  mockedApi.sendResetCode.mockResolvedValue(undefined);
  await act(async () => {
    await result.current.sendCode();
  });
}

/** 코드까지 통과시켜 3단계로 보낸다. */
async function reachStep3(result: { current: Form }) {
  await reachStep2(result);
  await act(async () => result.current.setValue('code', '123456'));
  mockedApi.verifyResetCode.mockResolvedValue(true);
  await act(async () => {
    await result.current.submitCode();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('1단계 — 인증코드 보내기', () => {
  it('이메일이 비면 서버를 부르지 않는다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => {
      await result.current.sendCode();
    });
    expect(mockedApi.sendResetCode).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.step).toBe(1);
  });

  it('성공하면 2단계로 가고 타이머가 돈다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep2(result);
    expect(result.current.step).toBe(2);
    expect(result.current.secondsLeft).toBeGreaterThan(0);
  });

  it('소셜 계정이면 1단계에 머물고 socialBlocked 가 켜진다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    mockedApi.sendResetCode.mockRejectedValue(
      new api.PasswordResetRejectedError('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.', 'social')
    );
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.socialBlocked).toBe(true);
    expect(result.current.errors.email).toBe('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.');
  });

  it('없는 이메일이면 1단계에 머물고 socialBlocked 는 꺼진 채다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'nobody@cuddle.com'));
    mockedApi.sendResetCode.mockRejectedValue(
      new api.PasswordResetRejectedError('등록되지 않은 이메일입니다.', 'unknown')
    );
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.socialBlocked).toBe(false);
    expect(result.current.errors.email).toBe('등록되지 않은 이메일입니다.');
  });

  it('막힌 뒤 이메일을 고치면 안내가 사라진다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    mockedApi.sendResetCode.mockRejectedValue(
      new api.PasswordResetRejectedError('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.', 'social')
    );
    await act(async () => {
      await result.current.sendCode();
    });
    expect(result.current.socialBlocked).toBe(true);

    await act(async () => result.current.setValue('email', 'other@cuddle.com'));
    expect(result.current.socialBlocked).toBe(false);
  });
});

describe('2단계 — 코드 확인', () => {
  it('코드가 맞으면 3단계로 간다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep3(result);
    expect(result.current.step).toBe(3);
  });

  it('코드가 틀리면 2단계에 그대로 있는다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep2(result);

    await act(async () => result.current.setValue('code', '000000'));
    mockedApi.verifyResetCode.mockResolvedValue(false);
    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.step).toBe(2);
    expect(result.current.errors.code).toBeTruthy();
  });

  it('코드가 비면 서버를 부르지 않는다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep2(result);

    await act(async () => {
      await result.current.submitCode();
    });

    expect(mockedApi.verifyResetCode).not.toHaveBeenCalled();
    expect(result.current.errors.code).toBe('전송된 코드를 입력해주세요');
  });

  it('재전송이 실패해도 2단계에 머문다 — 넣던 코드를 잃으면 안 된다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep2(result);

    mockedApi.sendResetCode.mockRejectedValue(new Error('네트워크'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(2);
  });
});

describe('3단계 — 새 비밀번호', () => {
  it('규칙에 어긋나면 서버를 부르지 않는다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'short'));
    await act(async () => result.current.setValue('passwordConfirm', 'short'));
    await act(async () => {
      await result.current.submitNewPassword();
    });

    expect(mockedApi.resetPassword).not.toHaveBeenCalled();
    expect(result.current.errors.password).toBeTruthy();
  });

  it('두 칸이 다르면 서버를 부르지 않는다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'Abcdef1!xy'));
    await act(async () => result.current.setValue('passwordConfirm', 'Abcdef1!zz'));
    await act(async () => {
      await result.current.submitNewPassword();
    });

    expect(mockedApi.resetPassword).not.toHaveBeenCalled();
    expect(result.current.errors.passwordConfirm).toBeTruthy();
  });

  it('성공하면 true 를 주고 셋을 그대로 서버에 보낸다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'Abcdef1!xy'));
    await act(async () => result.current.setValue('passwordConfirm', 'Abcdef1!xy'));
    mockedApi.resetPassword.mockResolvedValue(undefined);

    let ok = false;
    await act(async () => {
      ok = await result.current.submitNewPassword();
    });

    expect(ok).toBe(true);
    expect(mockedApi.resetPassword).toHaveBeenCalledWith({
      email: 'me@cuddle.com',
      newPassword: 'Abcdef1!xy',
      confirmPassword: 'Abcdef1!xy',
    });
  });

  it('서버가 거절하면 false 를 주고 그 문구를 보여준다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'Abcdef1!xy'));
    await act(async () => result.current.setValue('passwordConfirm', 'Abcdef1!xy'));
    mockedApi.resetPassword.mockRejectedValue(
      new api.PasswordResetRejectedError('이메일 인증이 필요합니다.', 'unknown')
    );

    let ok = true;
    await act(async () => {
      ok = await result.current.submitNewPassword();
    });

    expect(ok).toBe(false);
    expect(result.current.formError).toBe('이메일 인증이 필요합니다.');
  });
});

describe('뒤로', () => {
  it('2단계에서 뒤로 가면 1단계로 돌아가고 코드가 지워진다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep2(result);
    await act(async () => result.current.setValue('code', '123456'));

    await act(async () => result.current.goPreviousStep());

    expect(result.current.step).toBe(1);
    expect(result.current.values.code).toBe('');
    expect(result.current.values.email).toBe('me@cuddle.com');
  });

  it('3단계에서 뒤로 가면 2단계로 돌아간다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.goPreviousStep());

    expect(result.current.step).toBe(2);
  });
});

describe('타이머', () => {
  it('5분이 지나면 2단계에서 1단계로 돌아간다', async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useFindPassword());
    await reachStep2(result);

    // ⚠️ waitFor 를 쓰지 않는다. 가짜 타이머를 켜 두면 waitFor 가 기다리는 시계도 멈춰 있다.
    //    act 로 시간을 감으면 그 안에서 상태와 효과가 다 흘러가므로 바로 확인하면 된다.
    // ⚠️ 비동기 act 여야 한다. act(() => …) 로 감으면 시계가 안 돈다
    //    (가입 시험도 await act(async () => …) 로 쓴다)
    await act(async () => {
      jest.advanceTimersByTime(300_000);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.step).toBe(1);
    expect(result.current.values.code).toBe('');
    jest.useRealTimers();
  });
});
