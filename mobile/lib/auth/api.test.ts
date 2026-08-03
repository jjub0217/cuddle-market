jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

import { apiFetch } from './api';
import { useAuthStore } from './store';

const mockFetch = jest.fn();

// products.test.ts와 같은 결: 진짜 Response 대신 필요한 필드만 가진 객체를 쓴다.
function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 요청에 실린 헤더를 통째로 꺼낸다. */
function headersOf(call: unknown[]): Record<string, string> {
  const init = call[1] as { headers?: Record<string, string> } | undefined;
  return init?.headers ?? {};
}

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  return headersOf(call).Authorization;
}

beforeEach(() => {
  mockFetch.mockReset();
  (SecureStore.setItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  (SecureStore.deleteItemAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'old-token', refreshToken: 'r-token' });
});

describe('apiFetch', () => {
  it('액세스 토큰을 Bearer로 붙여 보낸다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: 'ok' }));

    await apiFetch('/profile/me');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/profile/me');
    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer old-token');
  });

  it('401이 아니면 갱신하지 않고 그대로 돌려준다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('401이면 갱신한 뒤 원래 요청을 딱 1번 재시도한다', async () => {
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { data: { accessToken: 'new-token' } }))
      .mockResolvedValueOnce(reply(200, { data: 'ok' }));

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // 두 번째 호출이 갱신 요청
    expect(mockFetch.mock.calls[1][0]).toBe('https://test.local/api/auth/refresh');
    // 세 번째 호출(재시도)에는 새 토큰이 붙어야 한다
    expect(authHeaderOf(mockFetch.mock.calls[2])).toBe('Bearer new-token');
    // 새 토큰이 store와 기기 양쪽에 반영됐는지
    expect(useAuthStore.getState().accessToken).toBe('new-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.accessToken', 'new-token');
  });

  it('갱신 요청에도 액세스 토큰을 함께 실어 보낸다', async () => {
    // 이 서버는 /auth/refresh를 인증 필터 뒤에 뒀다(실기기 진단으로 확인).
    // 리프레시 토큰을 본문에만 담으면 401 UNAUTHORIZED로 문 앞에서 막힌다.
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { data: { accessToken: 'new-token' } }))
      .mockResolvedValueOnce(reply(200));

    await apiFetch('/profile/me');

    expect(mockFetch.mock.calls[1][0]).toBe('https://test.local/api/auth/refresh');
    expect(authHeaderOf(mockFetch.mock.calls[1])).toBe('Bearer old-token');
  });

  it('갱신 응답에 새 리프레시 토큰이 오면 그것도 저장한다', async () => {
    // 서버는 갱신할 때마다 리프레시 토큰을 새로 주고 옛 것을 블랙리스트에 넣는다(1회용).
    // 새 것을 안 받아두면 두 번째 갱신이 "이미 로그아웃된 토큰"으로 반드시 실패한다.
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(
        reply(200, { data: { accessToken: 'new-token', refreshToken: 'new-refresh' } })
      )
      .mockResolvedValueOnce(reply(200));

    await apiFetch('/profile/me');

    expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cuddle.refreshToken', 'new-refresh');
  });

  it('갱신 응답에 리프레시 토큰이 없으면 쓰던 것을 그대로 둔다', async () => {
    // 서버가 안 줄 수도 있다. 그때 기존 것을 지워버리면 다음 갱신 기회까지 잃는다.
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, { data: { accessToken: 'new-token' } }))
      .mockResolvedValueOnce(reply(200));

    await apiFetch('/profile/me');

    expect(useAuthStore.getState().refreshToken).toBe('r-token');
  });

  it('재시도가 또 401이어도 무한 반복하지 않는다', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      String(url).endsWith('/auth/refresh')
        ? reply(200, { data: { accessToken: 'new-token' } })
        : reply(401)
    );

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(401);
    // 원요청 1 + 갱신 1 + 재시도 1 = 3. 그 이상이면 재시도가 반복되고 있는 것.
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('동시에 401을 맞은 요청 3개가 있어도 갱신은 1번만 한다', async () => {
    let refreshCalls = 0;
    mockFetch.mockImplementation(
      async (url: string, init?: { headers?: Record<string, string> }) => {
        if (String(url).endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return reply(200, { data: { accessToken: 'new-token' } });
        }
        return init?.headers?.Authorization === 'Bearer new-token' ? reply(200) : reply(401);
      }
    );

    const results = await Promise.all([apiFetch('/a'), apiFetch('/b'), apiFetch('/c')]);

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
  });

  it('갱신에 실패하면 토큰을 지우고 게스트가 된다', async () => {
    mockFetch
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(401)); // 갱신도 401

    const res = await apiFetch('/profile/me');

    // 화면을 강제로 옮기지는 않는다. 원래 요청의 실패를 그대로 돌려준다(설계 §7.3).
    expect(res.status).toBe(401);
    expect(useAuthStore.getState().status).toBe('guest');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cuddle.accessToken');
  });

  it('리프레시 토큰이 없으면 갱신을 시도조차 하지 않는다', async () => {
    useAuthStore.setState({ status: 'authed', accessToken: 'old-token', refreshToken: null });
    mockFetch.mockResolvedValue(reply(401));

    const res = await apiFetch('/profile/me');

    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('guest');
  });
});

describe('본문 종류에 따라 Content-Type을 가른다', () => {
  // 사진을 보낼 때 Content-Type을 우리가 정하면 안 된다.
  // 런타임이 경계 문자열(boundary)을 붙여 스스로 정해야 서버가 본문을 가를 수 있다.
  //
  // 이 시험이 없으면 사진이 **조용히** 안 올라가고 원인을 찾기 아주 어렵다.

  it('JSON을 보낼 때는 붙인다', async () => {
    mockFetch.mockResolvedValue(reply(200));

    await apiFetch('/products', { method: 'POST', body: JSON.stringify({ a: 1 }) });

    expect(headersOf(mockFetch.mock.calls[0])['Content-Type']).toBe('application/json');
  });

  it('본문이 없어도 붙인다', async () => {
    // 지금까지 돌던 GET들이 그대로 돌아야 한다
    mockFetch.mockResolvedValue(reply(200));

    await apiFetch('/products');

    expect(headersOf(mockFetch.mock.calls[0])['Content-Type']).toBe('application/json');
  });

  it('FormData를 보낼 때는 **안** 붙인다', async () => {
    mockFetch.mockResolvedValue(reply(200));
    const form = new FormData();
    form.append('files', { uri: 'file:///a.webp', name: 'a.webp', type: 'image/webp' } as never);

    await apiFetch('/images', { method: 'POST', body: form });

    expect(headersOf(mockFetch.mock.calls[0])['Content-Type']).toBeUndefined();
  });

  it('FormData여도 토큰은 붙인다', async () => {
    // 사진 올리기는 로그인이 필요하다
    mockFetch.mockResolvedValue(reply(200));
    const form = new FormData();

    await apiFetch('/images', { method: 'POST', body: form });

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer old-token');
  });
});
