import { apiFetch } from '../auth/api';

// 서버 응답 DTO 를 직접 열어 옮긴 것이다.
//   ChatRoomListItemResponse · ChatMessageListItemResponse · ChatRoomResponse
// 추측으로 필드를 지어내지 않는다 — 9바퀴에 그래서 차단 목록이 늘 비어 있었다.

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface ChatRoomListItem {
  chatRoomId: number;
  productId: number;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  opponentId: number;
  opponentNickname: string;
  opponentProfileImageUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  hasUnread: boolean;
  unreadCount: number;
}

export interface ChatMessage {
  messageId: number;
  senderId: number;
  senderNickname: string;
  messageType: MessageType;
  content: string;
  imageUrl: string | null;
  /** 개인정보가 들어 있어 서버가 막은 메시지. **보낸 사람에게만 온다.** */
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  isMine: boolean;
}

/** 방 목록 한 페이지. 웹과 같이 열 개씩 가져온다. */
export async function fetchChatRooms(
  page: number
): Promise<{ rooms: ChatRoomListItem[]; hasNext: boolean }> {
  const res = await apiFetch(`/chat/rooms?page=${page}&size=10`);
  if (!res.ok) throw new Error(`채팅 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as {
    data?: { chatRooms?: ChatRoomListItem[]; hasNext?: boolean };
  };
  return {
    rooms: body.data?.chatRooms ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

/**
 * 채팅방 머리말에 그릴 것 — **상대**와 **무슨 상품** 이야기인가(#889).
 *
 * ⚠️ **일곱 값이 다 없을 수 있다.** 서버가 아직 안 실어 보내는 동안에도 화면이 멀쩡해야 해서
 * 전부 `| null` 로 둔다. 방 목록(`ChatRoomListItem`)에는 같은 이름의 값이 **안 비는 것으로**
 * 들어 있는데, 여기서는 그 타입을 그대로 쓰면 안 된다 — 「있는 것처럼 보이는」 타입이 된다.
 *
 * ⚠️ **상대가 회원 탈퇴하면 `opponentId` 가 없다.** 닉네임은 「알 수 없는 사용자」로 온다.
 * 그때는 프로필로 가는 길을 안 만든다 — 웹도 그렇다
 * (`ChatRoomInfo.tsx` 의 `hasOpponent` 가 프로필 링크를 가른다).
 */
export interface ChatRoomSummary {
  opponentId: number | null;
  opponentNickname: string | null;
  opponentProfileImageUrl: string | null;
  productId: number | null;
  productTitle: string | null;
  productPrice: number | null;
  productImageUrl: string | null;
}

/**
 * 이미 나갔거나 낄 수 없는 방(403).
 *
 * 화면에서 「다시 시도」 대신 「이미 나간 방」 안내를 띄우려고 따로 구분한다.
 * 알림 목록에는 나간 방의 알림이 그대로 남아 있어서, 그걸 누르면 여기로 온다.
 * 되돌릴 수 없는 상태라 다시 시도는 영원히 같은 403 이다.
 * (없는 상품을 `ProductNotFoundError` 로 가르는 것과 같은 방식이다.)
 */
export class ChatRoomAccessDeniedError extends Error {
  constructor() {
    super('채팅방에 접근할 수 없습니다.');
    this.name = 'ChatRoomAccessDeniedError';
  }
}

/**
 * 메시지 한 페이지. 웹과 같이 쉰 개씩 가져온다.
 *
 * ⚠️ 서버는 **최신부터** 가져와 그 페이지 안에서만 뒤집는다. 그래서
 * page 0 이 가장 최근 50개고, page 1 은 그보다 **앞선** 50개다.
 * 화면에 붙일 때 뒤가 아니라 **앞에** 붙여야 한다 — `prependOlder` 를 쓴다.
 *
 * ⚠️ 이 요청이 읽음 처리도 겸한다(서버가 마지막 읽은 시각을 갱신한다).
 *
 * ⚠️ `isOpponentBlocked` 도 여기 실려 온다. 앱 채팅방은 방 정보를 안 가져오고 메시지만
 * 조회해서, 입력창을 잠글 값을 받을 데가 여기뿐이다(#877). 웹은 방 목록에서 읽는다.
 *
 * ⚠️ 상대·상품(`room`)도 같은 이유로 여기 얹혀 온다(#889). **방 단건 조회 API 가 없고**,
 * 방 목록은 열 개씩 나뉘어 있어 알림으로 바로 들어온 방은 첫 쪽에 없을 수 있다.
 * 서버가 아직 안 줄 때는 값이 다 `null` 이고, 그러면 화면이 머리말을 안 그린다.
 */
export async function fetchChatMessages(
  chatRoomId: number,
  page: number
): Promise<{
  messages: ChatMessage[];
  hasNext: boolean;
  isOpponentBlocked: boolean;
  room: ChatRoomSummary;
}> {
  const res = await apiFetch(`/chat/rooms/${chatRoomId}/messages?page=${page}&size=50`);
  // 나간 방이면 서버가 403 을 준다(ChatServiceImpl:371 · CHAT_ROOM_ACCESS_DENIED).
  if (res.status === 403) throw new ChatRoomAccessDeniedError();
  if (!res.ok) throw new Error(`메시지를 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as {
    data?: {
      messages?: ChatMessage[];
      hasNext?: boolean;
      isOpponentBlocked?: boolean;
    } & Partial<ChatRoomSummary>;
  };
  const data = body.data;
  return {
    messages: data?.messages ?? [],
    hasNext: data?.hasNext ?? false,
    // 서버가 안 주면 안 잠근다 — 못 보내게 막는 쪽으로 넘어지면 멀쩡한 방이 먹통이 된다.
    isOpponentBlocked: data?.isOpponentBlocked ?? false,
    // 서버가 안 주면 다 null 이다. 여기서 던지면 **메시지까지 못 보게 된다** —
    // 머리말은 곁들이는 것이지 방을 여는 조건이 아니다.
    room: {
      opponentId: data?.opponentId ?? null,
      opponentNickname: data?.opponentNickname ?? null,
      opponentProfileImageUrl: data?.opponentProfileImageUrl ?? null,
      productId: data?.productId ?? null,
      productTitle: data?.productTitle ?? null,
      productPrice: data?.productPrice ?? null,
      productImageUrl: data?.productImageUrl ?? null,
    },
  };
}

/**
 * 「나는 지금 이 방을 보고 있다」를 서버에 다시 알린다(#886).
 *
 * 서버는 이 표시를 **메시지 첫 페이지를 조회할 때만** 세우고 **5분 뒤 지운다**
 * (`ChatSessionServiceImpl` 의 `SESSION_TTL_MINUTES = 5`). 갱신하는 곳이 없어서,
 * 방을 열어 두고 5분이 지나면 서버가 「이 사람 방에 없다」고 보고 안 읽은 수를 올리고
 * 알림까지 만든다. **읽고 있는 글에 「안 읽음 1」이 붙는다.**
 *
 * 이 요청이 읽음 처리도 겸하므로, 이미 올라간 수도 여기서 0으로 돌아온다.
 *
 * ⚠️ 메시지를 받아 오려는 게 아니라 **알리려고** 부른다. 그래서 한 개만 받고 버린다.
 *    웹도 같은 방식이다(`src/lib/api/chatting.ts` 의 `pingChatRoomRead`).
 */
export async function pingChatRoomRead(chatRoomId: number): Promise<void> {
  await apiFetch(`/chat/rooms/${chatRoomId}/messages?page=0&size=1`);
}

/**
 * 상품으로 방을 만든다. 이미 있으면 서버가 그 방을 돌려준다.
 *
 * ⚠️ 응답(ChatRoomResponse)에는 `opponentId` 가 없다. 상대 정보가 필요하면
 * 방 목록에서 다시 찾아야 한다.
 */
export async function createChatRoom(productId: number): Promise<number> {
  const res = await apiFetch('/chat/rooms', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error(`채팅방을 만들지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { chatRoomId?: number } };
  const chatRoomId = body.data?.chatRoomId;
  if (typeof chatRoomId !== 'number') throw new Error('채팅방 번호가 오지 않았어요');
  return chatRoomId;
}

export async function leaveChatRoom(chatRoomId: number): Promise<void> {
  const res = await apiFetch(`/chat/rooms/${chatRoomId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`채팅방을 나가지 못했어요 (HTTP ${res.status})`);
}
