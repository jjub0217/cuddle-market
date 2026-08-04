// apiFetch가 SecureStore를 타는데 네이티브 모듈이라 jest에서 못 돈다.
// products.test.ts가 같은 이유로 같은 mock을 쓴다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchMe, updateMe } from './profile';

const mockFetch = jest.fn();

/** 요청에 실린 두 번째 인자(method·body 등)를 꺼낸다 */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
});

// 실측한 서버 응답 모양 그대로다(GET /profile/me).
const ME = {
  id: 4,
  nickname: '테스트중2',
  profileImageUrl: null,
  addressSido: '서울특별시',
  addressGugun: '강남구',
  birthDate: '1988-04-03',
};

describe('fetchMe', () => {
  it('생년월일까지 담아서 준다 — needsSocialSignup이 이 값을 본다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await expect(fetchMe()).resolves.toMatchObject({ birthDate: '1988-04-03' });
  });
});

describe('updateMe', () => {
  it('PATCH로 네 값을 보낸다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await updateMe({
      nickname: '주현',
      birthDate: '1988-04-03',
      addressSido: '서울특별시',
      addressGugun: '강남구',
    });

    const init = initOf(mockFetch.mock.calls[0]);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body ?? '{}')).toEqual({
      nickname: '주현',
      birthDate: '1988-04-03',
      addressSido: '서울특별시',
      addressGugun: '강남구',
    });
  });

  it('서버가 막으면 던진다 — 화면이 「저장됐다」고 하면 안 된다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    await expect(
      updateMe({ nickname: 'ㄱ', birthDate: '1988-04-03', addressSido: '서울특별시', addressGugun: '강남구' })
    ).rejects.toThrow();
  });
});
