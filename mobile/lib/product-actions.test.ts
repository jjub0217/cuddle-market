// apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { deleteProduct, updateTradeStatus } from './product-actions';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 요청에 실린 Authorization 헤더를 꺼낸다. */
function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as { headers?: Record<string, string> } | undefined;
  return init?.headers?.Authorization;
}

/** 요청 본문을 객체로 꺼낸다. */
function bodyOf(call: unknown[]): unknown {
  const init = call[1] as { body?: string } | undefined;
  return init?.body ? JSON.parse(init.body) : undefined;
}

/** 요청 메서드를 꺼낸다. */
function methodOf(call: unknown[]): string | undefined {
  const init = call[1] as { method?: string } | undefined;
  return init?.method;
}

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('updateTradeStatus', () => {
  it('PATCH로 상태를 보낸다', async () => {
    await updateTradeStatus(7, 'RESERVED');

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/products/7/trade-status');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('PATCH');
    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ tradeStatus: 'RESERVED' });
  });

  it('토큰을 붙여 보낸다', async () => {
    // 내 상품만 바꿀 수 있는 동작이라 토큰이 없으면 서버가 거부한다.
    await updateTradeStatus(7, 'COMPLETED');

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token');
  });

  it('실패하면 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));

    await expect(updateTradeStatus(7, 'SELLING')).rejects.toThrow('거래 상태');
  });
});

describe('deleteProduct', () => {
  it('DELETE로 보낸다', async () => {
    await deleteProduct(9);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/products/9');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('DELETE');
  });

  it('토큰을 붙여 보낸다', async () => {
    await deleteProduct(9);

    expect(authHeaderOf(mockFetch.mock.calls[0])).toBe('Bearer a-token');
  });

  it('실패하면 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(403));

    await expect(deleteProduct(9)).rejects.toThrow('삭제');
  });
});
