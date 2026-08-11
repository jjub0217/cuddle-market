// apiFetch가 SecureStore를 딸고 들어온다. 네이티브 모듈이라 jest에서 못 돈다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from '../auth/store';
import {
  ChatRoomAccessDeniedError,
  createChatRoom,
  fetchChatMessages,
  fetchChatRooms,
  leaveChatRoom,
  pingChatRoomRead,
} from './api';

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

  // 입력창을 잠글 값이다(#877). 앱 채팅방은 방 정보를 안 가져와서 여기서만 받는다.
  it('isOpponentBlocked 를 꺼낸다', async () => {
    mockFetch.mockResolvedValueOnce(
      reply(200, { data: { messages: [], hasNext: false, isOpponentBlocked: true } })
    );

    await expect(fetchChatMessages(7, 0)).resolves.toMatchObject({ isOpponentBlocked: true });
  });

  // 서버가 아직 안 주는 동안에도 멀쩡한 방이 먹통이 되면 안 된다.
  it('isOpponentBlocked 가 없으면 false 다', async () => {
    mockFetch.mockResolvedValueOnce(reply(200, { data: { messages: [], hasNext: false } }));

    await expect(fetchChatMessages(7, 0)).resolves.toMatchObject({ isOpponentBlocked: false });
  });

  // 머리말에 그릴 상대·상품(#889). 방 단건 조회 API 가 없어 여기 얹혀 온다.
  it('상대·상품을 꺼낸다', async () => {
    mockFetch.mockResolvedValueOnce(
      reply(200, {
        data: {
          messages: [],
          hasNext: false,
          opponentId: 9,
          opponentNickname: '홍길동',
          opponentProfileImageUrl: 'https://cdn/me.webp',
          productId: 3,
          productTitle: '개구리 사료',
          productPrice: 12000,
          productImageUrl: 'https://cdn/x.webp',
        },
      })
    );

    const result = await fetchChatMessages(7, 0);

    expect(result.room).toEqual({
      opponentId: 9,
      opponentNickname: '홍길동',
      opponentProfileImageUrl: 'https://cdn/me.webp',
      productId: 3,
      productTitle: '개구리 사료',
      productPrice: 12000,
      productImageUrl: 'https://cdn/x.webp',
    });
  });

  // ⚠️ **서버가 아직 안 얹어 준다.** 그동안에도 메시지는 그대로 보여야 한다 —
  //    머리말은 곁들이는 것이지 방을 여는 조건이 아니다.
  it('상대·상품이 없으면 다 null 이고 메시지는 그대로 온다', async () => {
    mockFetch.mockResolvedValueOnce(
      reply(200, {
        data: {
          messages: [{ messageId: 1, content: '안녕하세요' }],
          hasNext: false,
        },
      })
    );

    const result = await fetchChatMessages(7, 0);

    expect(result.messages).toHaveLength(1);
    expect(result.room).toEqual({
      opponentId: null,
      opponentNickname: null,
      opponentProfileImageUrl: null,
      productId: null,
      productTitle: null,
      productPrice: null,
      productImageUrl: null,
    });
  });

  // 탈퇴한 상대. 서버가 id 를 안 주고 닉네임만 「알 수 없는 사용자」로 준다 —
  // 화면은 이 값으로 프로필 링크를 뗀다.
  it('탈퇴한 상대는 opponentId 가 null 이고 닉네임은 남는다', async () => {
    mockFetch.mockResolvedValueOnce(
      reply(200, {
        data: {
          messages: [],
          hasNext: false,
          opponentNickname: '알 수 없는 사용자',
          productId: 3,
        },
      })
    );

    const result = await fetchChatMessages(7, 0);

    expect(result.room.opponentId).toBeNull();
    expect(result.room.opponentNickname).toBe('알 수 없는 사용자');
  });
});

// 「나는 이 방을 보고 있다」를 다시 알리는 요청(#886). 서버 표시가 5분에 만료되는데
// 갱신하는 곳이 없어서, 읽고 있는 방에 안 읽음 수가 쌓이고 알림까지 왔다.
describe('pingChatRoomRead', () => {
  it('첫 페이지를 한 개만 달라고 한다', async () => {
    mockFetch.mockResolvedValueOnce(reply(200, { data: { messages: [], hasNext: false } }));

    await pingChatRoomRead(7);

    // size 를 크게 부르면 알리려고 부른 요청이 메시지 쉰 개를 실어 온다.
    expect(mockFetch.mock.calls[0][0]).toContain('/chat/rooms/7/messages?page=0&size=1');
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

describe('나간 채팅방', () => {
  // 알림 목록에는 나간 방의 알림이 그대로 남는다. 그걸 누르면 여기로 온다.
  // 되돌릴 수 없는 상태라 화면이 「다시 시도」 대신 다른 안내를 띄워야 해서 따로 가른다.
  it('403 이면 ChatRoomAccessDeniedError 를 던진다', async () => {
    mockFetch.mockResolvedValueOnce(reply(403, { message: '채팅방에 대한 접근 권한이 없습니다.' }));
    await expect(fetchChatMessages(7, 0)).rejects.toBeInstanceOf(ChatRoomAccessDeniedError);
  });

  it('다른 오류는 보통 오류다', async () => {
    mockFetch.mockResolvedValueOnce(reply(500));
    const error = await fetchChatMessages(7, 0).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ChatRoomAccessDeniedError);
  });
});
