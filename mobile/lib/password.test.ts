// apiFetch가 SecureStore를 타는데 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { changePassword, PasswordChangeRejectedError } from './password';

const mockFetch = jest.fn();

/** 요청에 실린 두 번째 인자(method·body 등)를 꺼낸다 */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  // 로그인한 사람만 쓰는 길이다. 토큰이 붙어야 서버가 누구인지 안다
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
});

const 입력 = {
  currentPassword: 'old1234!',
  newPassword: 'new1234!',
  confirmPassword: 'new1234!',
};

describe('changePassword', () => {
  it('PATCH /auth/password/change 로 셋을 보낸다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await changePassword(입력);

    expect(mockFetch.mock.calls[0][0]).toContain('/auth/password/change');
    const init = initOf(mockFetch.mock.calls[0]);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body ?? '{}')).toEqual(입력);
  });

  it('확인용 비밀번호도 **서버로 보낸다**', async () => {
    // ⚠️ 앱에서만 맞춰보고 빼면 400 이 난다. 비밀번호 재설정에서 이미 겪은 함정이다
    //    (`lib/find-password/api.ts:97-99` — PasswordChangeRequest 도 셋 다 @NotBlank).
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await changePassword(입력);

    expect(JSON.parse(initOf(mockFetch.mock.calls[0]).body ?? '{}')).toHaveProperty(
      'confirmPassword'
    );
  });

  it('로그인 토큰을 붙여 보낸다', async () => {
    // 서버는 토큰으로 「누구의 비밀번호인지」를 안다. 이메일을 안 보낸다
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await changePassword(입력);

    const headers = (mockFetch.mock.calls[0][1] as { headers?: Record<string, string> }).headers;
    expect(headers?.Authorization).toBe('Bearer token');
  });

  it('서버가 막으면 **그 문구를 그대로** 던진다', async () => {
    // 「현재 비밀번호가 일치하지 않습니다」 같은 것을 사용자에게 보여줘야 한다.
    // 앱이 「변경에 실패했어요」로 뭉개면 무엇이 틀렸는지 알 길이 없다.
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: '현재 비밀번호가 일치하지 않습니다.' }),
    });

    await expect(changePassword(입력)).rejects.toThrow('현재 비밀번호가 일치하지 않습니다.');
    await expect(changePassword(입력)).rejects.toBeInstanceOf(PasswordChangeRejectedError);
  });

  it('서버가 문구를 안 주면 앱의 기본 문구로 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    await expect(changePassword(입력)).rejects.toThrow('비밀번호 변경에 실패했어요');
  });

  it('응답이 JSON 이 아니어도 터지지 않는다', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(changePassword(입력)).rejects.toThrow('비밀번호 변경에 실패했어요');
  });
});
