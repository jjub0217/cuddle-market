// apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchMyFavorites, fetchMyProducts, fetchMyPurchases } from './my-lists';

const mockFetch = jest.fn();

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined;
  return init?.headers?.Authorization;
}

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const emptyPage = {
  code: 'SUCCESS',
  message: 'ok',
  data: { page: 0, size: 20, content: [], hasNext: false },
};

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200, emptyPage));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('내 목록 조회', () => {
  it('찜한 상품은 /profile/me/favorites 를 부른다', async () => {
    await fetchMyFavorites(0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/favorites?page=0&size=20'
    );
  });

  it('판매 내역은 /profile/me/products 를 부른다', async () => {
    await fetchMyProducts(0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/products?page=0&size=20'
    );
  });

  it('구매 내역은 /profile/me/purchase-requests 를 부른다', async () => {
    await fetchMyPurchases(0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/me/purchase-requests?page=0&size=20'
    );
  });

  it('page 번호가 주소에 반영된다', async () => {
    await fetchMyFavorites(3);

    expect(mockFetch.mock.calls[0][0]).toContain('page=3');
  });

  it('토큰을 붙여 보낸다', async () => {
    // #784에서 products.ts가 토큰 없이 조회해 찜 하트가 도로 꺼졌다.
    // 이 목록들은 셋 다 로그인해야만 볼 수 있으므로 토큰이 없으면 아예 못 받는다.
    await fetchMyFavorites(0);

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token');
  });

  it('응답의 data를 그대로 돌려준다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        code: 'SUCCESS',
        message: 'ok',
        data: { page: 0, size: 20, content: [{ id: 7 }], hasNext: true },
      })
    );

    const result = await fetchMyProducts(0);

    expect(result.content).toHaveLength(1);
    expect(result.hasNext).toBe(true);
  });

  it('실패하면 목록 이름이 담긴 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    await expect(fetchMyPurchases(0)).rejects.toThrow('구매 내역');
  });
});
