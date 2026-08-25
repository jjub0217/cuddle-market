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

  // ⚠️ **아래 셋은 #849 2단계에서 뒤집힌 시험이다.** 예전에는 「소셜이면 1단계에 머물고
  //    blocked 가 social 이 된다」를 지켰는데, 그 동작이 곧 계정 열거였다 — 화면이
  //    「이 이메일은 카카오로 가입했다」를 말해 줬다는 뜻이기 때문이다.
  //
  //    이제 서버가 없는 이메일·소셜·LOCAL 셋 모두에 200 을 주므로, 앱은 **누가 왔는지
  //    알 수 없고 알아서도 안 된다.** 그래서 지켜야 할 것이 반대가 됐다 —
  //    「구분하지 않고 똑같이 2단계로 간다」.

  it('서버가 성공을 주면 누구든 똑같이 2단계로 간다 — 소셜인지 아닌지 알 수 없다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'social-user@cuddle.com'));
    mockedApi.sendResetCode.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(2);
    expect(result.current.errors.email).toBeUndefined();
  });

  it('가입되지 않은 이메일이어도 똑같이 2단계로 간다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'nobody@cuddle.com'));
    mockedApi.sendResetCode.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(2);
    expect(result.current.errors.email).toBeUndefined();
  });

  it('진짜 탈이 나면 1단계에 머물고 뭉뚱그린 오류만 말한다 — 까닭은 안 알려준다', async () => {
    const { result } = await renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    mockedApi.sendResetCode.mockRejectedValue(new Error('인증코드 발송에 실패했어요 (HTTP 500)'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.errors.email).toBe('인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.');
    // ⚠️ 서버가 준 문구(HTTP 500)를 그대로 뿌리지 않는다. 서버 문구가 화면에 나가면
    //    나중에 서버가 갈라 말하기 시작했을 때 그것이 그대로 새어 나간다.
    expect(result.current.errors.email).not.toContain('500');
  });
});
