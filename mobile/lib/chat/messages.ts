import { chatDateKey, formatChatDate } from '@cuddle/shared';

import type { ChatMessage } from './api';

// 화면에 그리기 전에 메시지를 다루는 규칙을 여기 모은다.
// 소켓·화면이 없어야 시험할 수 있어서, 순수 함수만 둔다.

/**
 * 「더 보기」로 가져온 과거를 **앞에** 붙인다.
 *
 * 서버가 최신부터 페이지를 나누기 때문이다 — page 1 은 page 0 보다 앞선 메시지다.
 * 뒤에 이어붙이면 과거가 아래로 내려간다(웹이 그렇게 되어 있다).
 *
 * 차례는 **messageId 로 다시 세운다.** 붙이는 자리로만 정하면, 겹치는 메시지가
 * 어느 쪽에서 먼저 왔느냐에 따라 과거가 아래로 튀어 올라간다. messageId 는 서버가
 * 하나씩 늘려 주는 값이라 작을수록 옛 메시지다 — 오름차순이 곧 시간 차례다.
 */
export function prependOlder(current: ChatMessage[], older: ChatMessage[]): ChatMessage[] {
  // 같은 메시지가 양쪽으로 들어오면(붙기 → 구독 → 조회) 뒤에 온 것으로 덮는다.
  // id 가 없는 것(나가기 안내)은 거를 수도 정렬할 수도 없다 — 있던 자리에 그대로 둔다.
  const withoutId = current.filter((message) => message.messageId == null);
  const merged = new Map<number, ChatMessage>();
  [...older, ...current]
    .filter((message) => message.messageId != null)
    .forEach((message) => merged.set(message.messageId, message));
  return [...Array.from(merged.values()).sort((a, b) => a.messageId - b.messageId), ...withoutId];
}

/**
 * 소켓으로 온 메시지에 `isMine` 을 채운다.
 *
 * ⚠️ **서버가 통로마다 다른 DTO 를 보낸다.** REST 의 `ChatMessageListItemResponse` 에는
 * `isMine` 이 있는데, 소켓의 `ChatMessageResponse` 에는 **없다.** 그대로 그리면 내가 방금
 * 보낸 메시지가 상대 것처럼 왼쪽에 붙는다. 웹도 `senderId` 로 직접 견줘서 피한다.
 */
export function withIsMine(message: ChatMessage, myId?: number): ChatMessage {
  if (typeof message.isMine === 'boolean') return message;
  return { ...message, isMine: message.senderId === myId };
}

/**
 * 소켓으로 새로 온 메시지. 이미 있으면 그대로 둔다.
 *
 * ⚠️ **`messageId` 가 없는 메시지가 온다.** 나가기 안내(SYSTEM)가 그렇다 —
 * 서버가 그 프레임만 손으로 만들어 보내면서 id 를 안 채운다
 * (`ChatWebSocketController.sendSystemMessage`). id 로 거르면 「id 가 없는 것」끼리
 * 서로 같다고 판단해 **두 번째부터 조용히 버려진다.** 그래서 id 가 없으면 안 거른다.
 */
export function appendNew(current: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (incoming.messageId == null) return [...current, incoming];
  if (current.some((m) => m.messageId === incoming.messageId)) return current;
  return [...current, incoming];
}

/**
 * 목록에 쓸 열쇠.
 *
 * `messageId` 가 없는 메시지(나가기 안내 등)는 시각과 차례로 만든다.
 * 그냥 `m-undefined` 로 두면 그런 메시지가 둘일 때 열쇠가 겹친다.
 */
export function messageKey(message: ChatMessage, index: number): string {
  if (message.messageId == null) return `sys-${message.createdAt}-${index}`;
  return `m-${message.messageId}`;
}

export interface DayGroup {
  /** 같은 날이면 같은 값 */
  key: string;
  /** 날짜 구분선에 그릴 글 — `'2026년 8월 10일 월요일'` */
  label: string;
  messages: ChatMessage[];
}

/** 날짜 구분선을 그리려고 날짜별로 묶는다. 들어온 차례를 그대로 지킨다. */
export function groupByDay(messages: ChatMessage[]): DayGroup[] {
  const groups: DayGroup[] = [];
  messages.forEach((message) => {
    const key = chatDateKey(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.messages.push(message);
      return;
    }
    groups.push({ key, label: formatChatDate(message.createdAt), messages: [message] });
  });
  return groups;
}
