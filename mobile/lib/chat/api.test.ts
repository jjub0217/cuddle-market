// apiFetch가 SecureStore를 딸고 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from '../auth/store';
import { createChatRoom, fetchChatMessages, fetchChatRooms, leaveChatRoom } from './api';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  mockFetch.mockReset();
  // apiFetch 는 이 값이 없으면 요청을 보내기 전에 던진다. 다른 시험들과 같이 여기서 심는다.
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  global.fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ accessToken: 'tok', refreshToken: 'ref', status: 'authed' });
});

describe('fetchChatRooms', () => {
  // ⚠️ 서버 DTO 그대로다(ChatRoomListResponse). 「다른 API가 이러니」로 지어내지 않는다.
  it('data.chatRooms 를 꺼낸다', async () => {
    mockFetch.mockResolvedValueOnce(
      reply(200, {
        data: {
          chatRooms: [
            {
              chatRoomId: 7,
              productId: 3,
              productTitle: '개구리 사료',
              productPrice: 12000,
              productImageUrl: 'https://cdn/x.webp',
              opponentId: 9,
              opponentNickname: '홍길동',
              opponentProfileImageUrl: null,
              lastMessage: '안녕하세요',
              lastMessageTime: '2026-08-10T07:12:42',
              hasUnread: true,
              unreadCount: 2,
            },
          ],
          hasNext: true,
        },
      })
    );

    const result = await fetchChatRooms(0);

    expect(mockFetch.mock.calls[0][0]).toContain('/chat/rooms?page=0&size=10');
    expect(result.hasNext).toBe(true);
    expect(result.rooms[0].opponentNickname).toBe('홍길동');
    expect(result.rooms[0].unreadCount).toBe(2);
  });

  it('실패하면 던진다', async () => {
    mockFetch.mockResolvedValueOnce(reply(500));
    await expect(fetchChatRooms(0)).rejects.toThrow();
  });
});

describe('fetchChatMessages', () => {
  it('data.messages 를 꺼낸다', async () => {
    mockFetch.mockResolvedValueOnce(
      reply(200, {
        data: {
          messages: [
            {
              messageId: 1,
              senderId: 9,
              senderNickname: '홍길동',
              messageType: 'TEXT',
              content: '안녕하세요',
              imageUrl: null,
              isBlocked: false,
              blockReason: null,
              createdAt: '2026-08-10T07:12:42',
              isMine: false,
            },
          ],
          hasNext: false,
        },
      })
    );

    const result = await fetchChatMessages(7, 0);

    expect(mockFetch.mock.calls[0][0]).toContain('/chat/rooms/7/messages?page=0&size=50');
    expect(result.messages[0].messageId).toBe(1);
    expect(result.hasNext).toBe(false);
  });
});

describe('createChatRoom', () => {
  it('만들어진 방 번호를 준다', async () => {
    mockFetch.mockResolvedValueOnce(reply(200, { data: { chatRoomId: 42 } }));
    await expect(createChatRoom(3)).resolves.toBe(42);
  });
});

describe('leaveChatRoom', () => {
  it('DELETE 를 보낸다', async () => {
    mockFetch.mockResolvedValueOnce(reply(200, {}));
    await leaveChatRoom(7);
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});
