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
