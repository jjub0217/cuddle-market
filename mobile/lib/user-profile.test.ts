jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchUserProducts, fetchUserProfile, UserNotFoundError } from './user-profile';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const emptyPage = { data: { page: 0, size: 20, content: [], hasNext: false } };

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200, emptyPage));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('fetchUserProfile', () => {
  it('/profile/{id} 를 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { id: 7, nickname: '지니' } }));

    await fetchUserProfile(7);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/profile/7');
  });

  it('isBlocked·isReported가 없으면 false로 본다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { id: 7, nickname: '지니' } }));

    const profile = await fetchUserProfile(7);

    expect(profile.isBlocked).toBe(false);
    expect(profile.isReported).toBe(false);
  });

  it('서버가 준 값을 그대로 쓴다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        data: {
          id: 7,
          nickname: '지니',
          introduction: '반갑습니다',
          isBlocked: true,
          isReported: true,
        },
      })
    );

    const profile = await fetchUserProfile(7);

    expect(profile.introduction).toBe('반갑습니다');
    expect(profile.isBlocked).toBe(true);
    expect(profile.isReported).toBe(true);
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUserProfile(7)).rejects.toThrow();
  });

  // 서버가 탈퇴한 사람을 걸러 404를 준다(ProfileServiceImpl.java:117).
  // 화면이 「탈퇴한 사용자예요」를 그리려면 이 404만 따로 알아볼 수 있어야 한다.
  it('404면 UserNotFoundError를 던진다 — 탈퇴한 사용자다', async () => {
    mockFetch.mockResolvedValue(reply(404));

    await expect(fetchUserProfile(7)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('404가 아닌 실패는 UserNotFoundError가 아니다', async () => {
    // 500(서버 탈)·401(로그인 필요)까지 「탈퇴」로 말하면 안 된다.
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUserProfile(7)).rejects.not.toBeInstanceOf(UserNotFoundError);

    mockFetch.mockResolvedValue(reply(401));
    await expect(fetchUserProfile(7)).rejects.not.toBeInstanceOf(UserNotFoundError);
  });
});

describe('fetchUserProducts', () => {
  it('판매상품은 /products 를 부른다', async () => {
    await fetchUserProducts(7, 'sell', 0);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/7/products?page=0&size=20'
    );
  });

  it('판매요청은 /purchase-requests 를 부른다 — 주소가 아예 다르다', async () => {
    await fetchUserProducts(7, 'request', 2);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/profile/7/purchase-requests?page=2&size=20'
    );
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUserProducts(7, 'sell', 0)).rejects.toThrow();
  });
});
