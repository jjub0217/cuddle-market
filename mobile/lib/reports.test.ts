// apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import {
  blockUser,
  fetchBlockedUsers,
  isAlreadyReported,
  reportProduct,
  reportUser,
  unblockUser,
} from './reports';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 요청에 실린 JSON 본문을 꺼낸다. */
function bodyOf(call: unknown[]): Record<string, unknown> {
  const init = call[1] as { body?: string } | undefined;
  return JSON.parse(init?.body ?? '{}');
}

function methodOf(call: unknown[]): string | undefined {
  return (call[1] as { method?: string } | undefined)?.method;
}

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue(reply(200));
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'a-token', refreshToken: 'r-token' });
});

describe('reportProduct', () => {
  it('reasonCodes를 배열로 보낸다 — 서버 DTO가 List<String>이다', async () => {
    await reportProduct(42, 'ILLEGAL_ITEM');

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/products/42');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('POST');
    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ reasonCodes: ['ILLEGAL_ITEM'] });
  });

  it('상세 사유가 있으면 함께 보낸다', async () => {
    await reportProduct(42, 'ETC', '가짜예요');

    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({
      reasonCodes: ['ETC'],
      detailReason: '가짜예요',
    });
  });

  it('상세 사유가 비어 있으면 아예 안 보낸다', async () => {
    await reportProduct(42, 'ETC', '   ');

    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ reasonCodes: ['ETC'] });
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(reportProduct(42, 'ETC')).rejects.toThrow();
  });
});

describe('reportUser', () => {
  it('reasonCode를 문자열로 보낸다 — 상품과 필드 이름이 다르다', async () => {
    await reportUser(7, 'HARASSMENT');

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/users/7');
    expect(bodyOf(mockFetch.mock.calls[0])).toEqual({ reasonCode: 'HARASSMENT' });
  });
});

describe('blockUser / unblockUser', () => {
  it('차단은 POST', async () => {
    await blockUser(7);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/blocks/users/7');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('POST');
  });

  it('해제는 DELETE', async () => {
    await unblockUser(7);

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.local/api/reports/blocks/users/7');
    expect(methodOf(mockFetch.mock.calls[0])).toBe('DELETE');
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(blockUser(7)).rejects.toThrow();
  });
});

describe('fetchBlockedUsers', () => {
  it('page와 size=20으로 부른다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, { data: { blockedUsers: { content: [], hasNext: false } } })
    );

    await fetchBlockedUsers(1);

    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://test.local/api/reports/blocks/users?page=1&size=20'
    );
  });

  // ⚠️ 이 API만 응답이 한 겹 더 감싸져 있다(BlockedUserListResponse.blockedUsers).
  // 처음에는 그 껍데기를 빠뜨려 실기기에서 목록이 늘 비어 있었다.
  it('data.blockedUsers 안의 content와 hasNext를 돌려준다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        data: {
          blockedUsers: {
            content: [{ blockedUserId: 7, nickname: '지니', profileImageUrl: null }],
            hasNext: true,
          },
        },
      })
    );

    const page = await fetchBlockedUsers(0);

    expect(page.content).toHaveLength(1);
    expect(page.content[0].blockedUserId).toBe(7);
    expect(page.content[0].nickname).toBe('지니');
    expect(page.hasNext).toBe(true);
  });

  it('껍데기가 없는 모양이면 빈 목록으로 본다 — 옛 모양을 통과시키지 않는다', async () => {
    mockFetch.mockResolvedValue(
      reply(200, { data: { content: [{ blockedUserId: 7 }], hasNext: true } })
    );

    const page = await fetchBlockedUsers(0);

    expect(page.content).toHaveLength(0);
    expect(page.hasNext).toBe(false);
  });
});

describe('isAlreadyReported', () => {
  it('중복 신고 메시지를 알아본다', () => {
    expect(isAlreadyReported(new Error('이미 신고한 상품입니다'))).toBe(true);
    expect(isAlreadyReported(new Error('이미 신고한 사용자입니다'))).toBe(true);
  });

  it('그 밖의 오류는 아니다', () => {
    expect(isAlreadyReported(new Error('서버 내부 오류가 발생했습니다'))).toBe(false);
    expect(isAlreadyReported(null)).toBe(false);
  });
});
