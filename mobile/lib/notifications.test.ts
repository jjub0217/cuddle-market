// 알림 조회도 apiFetch를 타므로 SecureStore가 딸려 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import {
  NOTIFICATION_MESSAGES,
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
  resolveTarget,
  type NotificationItem,
} from './notifications';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** 시험용 알림 하나. 필요한 필드만 바꿔 쓴다. */
function item(over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    notificationId: 1,
    notificationType: 'PRODUCT_FAVORITE_STATUS_CHANGED',
    title: '서버가 준 제목',
    content: "'개구리 사료' 상품의 거래 상태가 바뀌었습니다.",
    relatedEntityType: 'PRODUCT',
    relatedEntityId: 42,
    isRead: false,
    createdAt: '2026-07-31T10:00:00',
    ...over,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'guest', accessToken: null, refreshToken: null });
});

describe('fetchNotifications', () => {
  it('page와 size=10으로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { content: [], hasNext: false } }));

    await fetchNotifications(2);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/notifications?page=2&size=10',
      expect.anything()
    );
  });

  it('content와 hasNext를 돌려준다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { content: [item()], hasNext: true } }));

    const page = await fetchNotifications(0);

    expect(page.content).toHaveLength(1);
    expect(page.hasNext).toBe(true);
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchNotifications(0)).rejects.toThrow();
  });
});

describe('fetchUnreadCount', () => {
  it('개수를 숫자로 돌려준다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: { unreadCount: 3 } }));
    await expect(fetchUnreadCount()).resolves.toBe(3);
  });

  it('실패하면 0으로 본다 — 헤더의 점 하나 때문에 화면을 깨뜨리지 않는다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(fetchUnreadCount()).resolves.toBe(0);
  });
});

describe('markAsRead / markAllAsRead', () => {
  it('PATCH로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, {}));
    await markAsRead(7);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/notifications/7/read',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('전체 읽음도 PATCH로 부른다', async () => {
    mockFetch.mockResolvedValue(reply(200, {}));
    await markAllAsRead();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/notifications/read-all',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

describe('resolveTarget', () => {
  it('상품은 앱 화면으로', () => {
    expect(resolveTarget(item({ relatedEntityType: 'PRODUCT', relatedEntityId: 42 }))).toEqual({
      kind: 'app',
      path: '/products/42',
    });
  });

  it('관리자 제재는 앱 마이로', () => {
    expect(
      resolveTarget(
        item({ notificationType: 'ADMIN_SANCTION', relatedEntityType: null, relatedEntityId: null })
      )
    ).toEqual({ kind: 'app', path: '/(tabs)/(my)' });
  });

  it('채팅방은 앱에 화면이 없으니 웹으로', () => {
    expect(resolveTarget(item({ relatedEntityType: 'CHAT_ROOM', relatedEntityId: 9 }))).toEqual({
      kind: 'web',
      path: '/chat/9',
    });
  });

  it('커뮤니티 글도 웹으로', () => {
    expect(resolveTarget(item({ relatedEntityType: 'POST', relatedEntityId: 5 }))).toEqual({
      kind: 'web',
      path: '/community/5',
    });
  });

  it('게시글 삭제 알림은 커뮤니티 목록(웹)으로', () => {
    expect(
      resolveTarget(
        item({ notificationType: 'POST_DELETED', relatedEntityType: null, relatedEntityId: null })
      )
    ).toEqual({ kind: 'web', path: '/community' });
  });

  it('아무 데도 안 걸리면 앱 홈으로', () => {
    expect(
      resolveTarget(
        item({
          notificationType: 'PRODUCT_FAVORITE_PRICE_CHANGED',
          relatedEntityType: null,
          relatedEntityId: null,
        })
      )
    ).toEqual({ kind: 'app', path: '/(tabs)/(home)' });
  });
});

describe('NOTIFICATION_MESSAGES', () => {
  it('여덟 종류가 모두 있다 — 웹과 같은 문구를 쓴다', () => {
    expect(Object.keys(NOTIFICATION_MESSAGES)).toHaveLength(8);
    expect(NOTIFICATION_MESSAGES.PRODUCT_FAVORITE_STATUS_CHANGED).toBe(
      '찜한 상품의 거래 상태가 변경되었습니다'
    );
  });
});
