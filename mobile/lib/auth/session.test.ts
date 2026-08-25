jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { QueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { InvalidCredentialsError, login, logout, restore, withdraw } from './session';
import { useAuthStore } from './store';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  mockFetch.mockReset();
  (SecureStore.setItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  (SecureStore.getItemAsync as jest.Mock).mockReset();
  (SecureStore.deleteItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'restoring', accessToken: null, refreshToken: null });
});

describe('login', () => {
  it('성공하면 토큰을 store와 기기 양쪽에 넣는다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, { data: { accessToken: 'a', refreshToken: 'r', user: { id: 1 } } })
    );

    await login('me@cuddle.com', 'pw');

    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().accessToken).toBe('a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.accessToken', 'a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.refreshToken', 'r');
  });

  it('400이면 InvalidCredentialsError를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(400));

    await expect(login('me@cuddle.com', 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(useAuthStore.getState().status).toBe('restoring');
  });

  it('500이면 일반 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    await expect(login('me@cuddle.com', 'pw')).rejects.not.toBeInstanceOf(InvalidCredentialsError);
  });
});

describe('restore', () => {
  it('기기에 토큰이 있으면 authed로 되살린다', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
      key === 'cuddle.accessToken' ? 'a' : 'r'
    );

    await restore();

    expect(useAuthStore.getState().status).toBe('authed');
    expect(useAuthStore.getState().accessToken).toBe('a');
  });

  it('토큰이 없으면 guest가 된다', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    await restore();

    expect(useAuthStore.getState().status).toBe('guest');
  });
});

describe('logout', () => {
  it('서버 호출이 실패해도 기기 정리는 진행한다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'a', refreshToken: 'r' });
    // 로그아웃 API가 통째로 터지는 상황
    mockFetch.mockRejectedValue(new Error('네트워크 없음'));
    const queryClient = new QueryClient();

    await logout(queryClient);

    // 기기에 토큰이 남으면 "로그아웃했는데 로그인돼 있는" 상태가 된다.
    expect(useAuthStore.getState().status).toBe('guest');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cuddle.accessToken');
  });
});

describe('withdraw', () => {
  it('성공하면 로그아웃과 같은 정리를 한다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'a', refreshToken: 'r' });
    mockFetch.mockResolvedValue(reply(200));
    const queryClient = new QueryClient();

    await withdraw(queryClient, { reason: 'LOW_USAGE', detailReason: '' });

    expect(useAuthStore.getState().status).toBe('guest');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cuddle.refreshToken');
  });

  it('실패하면 던지고 세션은 그대로 둔다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'a', refreshToken: 'r' });
    mockFetch.mockResolvedValue(reply(500));
    const queryClient = new QueryClient();

    await expect(withdraw(queryClient, { reason: 'LOW_USAGE', detailReason: '' })).rejects.toThrow();
    // 탈퇴가 안 됐는데 로그아웃시키면 사용자가 상황을 오해한다.
    expect(useAuthStore.getState().status).toBe('authed');
  });
});

// **계정 열거를 막는 줄을 지킨다**(#849).
//
// 로그인이 실패한 까닭은 셋이다 — 없는 이메일 · 비밀번호 틀림 · 소셜로 가입함.
// 이 셋을 밖에서 **구분할 수 없어야** 한다. 구분되면 남의 이메일을 넣어 보는 것만으로
// 「이 사람은 회원이고 카카오를 쓴다」를 알아낼 수 있다.
//
// 바로 위 describe('login') 에 이미 「400이면 InvalidCredentialsError를 던진다」가 있다.
// 그것은 **오류의 종류**를 본다. 여기서 보는 것은 다른 것이다 —
// **서버가 준 문구가 그 오류에 실려 나오는가.**
//
// ⚠️ 진짜 회귀는 이 모양으로 온다.
//
//     throw new InvalidCredentialsError();        →  throw new Error(body.message);
//
//    이렇게 바뀌어도 「InvalidCredentialsError 인가」를 안 보는 시험은 통과한다.
//    화면 문구로 시험해도 마찬가지다 — 화면은 받은 것을 그릴 뿐이라, 새는 자리는 여기다.
//
// 지금 서버는 로그인 실패를 둘 다 같은 문구로 답한다(AuthServiceImpl.java:127·131).
// 하지만 그건 서버 사정이고, 앱이 서버 문구를 실어 나르기 시작하면 서버가 언젠가
// 갈라 말하는 순간 앱도 같이 샌다. 여기서 끊어 둔다.
describe('계정 열거 (#849)', () => {
  /** 로그인해 보고 **던져진 오류**를 돌려준다. */
  async function 로그인해본다(): Promise<Error> {
    return login('someone@example.com', 'Abcdefg1!x').then(
      () => {
        throw new Error('실패해야 하는데 성공했다');
      },
      (error: Error) => error
    );
  }

  it('서버가 가입 방법을 알려줘도 그 문구를 밖으로 안 흘린다', async () => {
    // 비밀번호 찾기 쪽 서버는 이미 이렇게 답한다(AuthServiceImpl.java:199).
    // 로그인도 언젠가 그렇게 바뀔 수 있다 — 그때 앱이 따라 새면 안 된다.
    mockFetch.mockResolvedValue(
      reply(400, { message: '카카오로 가입한 계정입니다. 카카오 로그인을 이용해주세요.' })
    );

    const error = await 로그인해본다();

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect(error.message).not.toContain('카카오');
  });

  it('가입되지 않은 이메일이라고 답해도 그 사실을 안 흘린다', async () => {
    mockFetch.mockResolvedValue(reply(400, { message: '등록되지 않은 이메일입니다.' }));

    const error = await 로그인해본다();

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect(error.message).not.toContain('등록되지 않은');
  });

  it('없는 계정이든 비밀번호가 틀렸든 **똑같은 오류**가 나온다', async () => {
    mockFetch.mockResolvedValue(reply(400, { message: '등록되지 않은 이메일입니다.' }));
    const 없는계정 = await 로그인해본다();

    mockFetch.mockResolvedValue(reply(401, { message: '이메일 또는 비밀번호가 일치하지 않습니다.' }));
    const 비밀번호틀림 = await 로그인해본다();

    expect(비밀번호틀림.message).toBe(없는계정.message);
    expect(비밀번호틀림.name).toBe(없는계정.name);
  });
});
