import type { IconSymbolName } from '@/components/ui/icon-symbol';

import { apiFetch } from './auth/api';

// 알림 API와 규칙을 한 곳에 모은다.
// 헤더(안 읽은 수)와 목록 화면(전부)이 같은 재료를 쓰므로, 두 군데에 흩어지면 어긋난다.
//
// 백엔드는 REST 4개가 이미 완비돼 있다(6바퀴 조사). 웹은 GraphQL을 거치지만
// 앱은 REST를 직접 부른다.

export type NotificationType =
  | 'CHAT_NEW_ROOM'
  | 'CHAT_NEW_MESSAGE'
  | 'PRODUCT_FAVORITE_STATUS_CHANGED'
  | 'PRODUCT_FAVORITE_PRICE_CHANGED'
  | 'ADMIN_SANCTION'
  | 'POST_DELETED'
  | 'COMMENT_REPLY'
  | 'POST_COMMENT';

export interface NotificationItem {
  notificationId: number;
  notificationType: NotificationType;
  /** 서버가 주지만 화면에는 안 쓴다 — 아래 NOTIFICATION_MESSAGES를 쓴다 */
  title: string;
  content: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * 화면에 보일 제목.
 *
 * 서버가 주는 title을 안 쓰는 이유: 웹도 이 상수를 쓴다(constants.ts의
 * NOTIFICATION_MESSAGES). 서버 값을 그대로 쓰면 같은 알림이 웹과 앱에서
 * 다른 문구로 보인다. 본문(content)은 상품 이름 같은 게 들어 있어 그대로 쓴다.
 */
export const NOTIFICATION_MESSAGES: Record<NotificationType, string> = {
  CHAT_NEW_ROOM: '새로운 채팅이 생성되었습니다',
  CHAT_NEW_MESSAGE: '새로운 메시지가 도착했습니다',
  PRODUCT_FAVORITE_STATUS_CHANGED: '찜한 상품의 거래 상태가 변경되었습니다',
  PRODUCT_FAVORITE_PRICE_CHANGED: '찜한 상품의 가격이 변동되었습니다',
  ADMIN_SANCTION: '관리자에 의해 제재를 받았습니다',
  POST_DELETED: '작성한 게시글이 삭제되었습니다',
  COMMENT_REPLY: '댓글에 새로운 답글이 달렸습니다',
  POST_COMMENT: '게시글에 새로운 댓글이 달렸습니다',
};

/**
 * 알림 종류별 아이콘.
 *
 * 이름은 SF Symbol 이름이다 — iOS는 이 이름을 그대로 쓰고, 안드로이드는
 * icon-symbol.tsx의 표를 거쳐 MaterialIcons로 바뀐다. 그래서 지어낸 이름을 쓰면
 * iOS에서만 아이콘이 사라진다. 아래 타입이 그걸 tsc 단계에서 막는다.
 *
 * `import type`이라 컴파일 뒤에는 사라진다 — 이 파일은 화면 코드를 안 끌어온다.
 */
export const NOTIFICATION_ICONS: Record<NotificationType, IconSymbolName> = {
  CHAT_NEW_ROOM: 'plus.bubble',
  CHAT_NEW_MESSAGE: 'message',
  PRODUCT_FAVORITE_STATUS_CHANGED: 'heart.slash',
  PRODUCT_FAVORITE_PRICE_CHANGED: 'tag',
  ADMIN_SANCTION: 'exclamationmark.shield',
  POST_DELETED: 'trash',
  COMMENT_REPLY: 'arrowshape.turn.up.left',
  POST_COMMENT: 'bubble.left',
};

/**
 * 알림 종류별 색(원 배경 + 아이콘).
 *
 * ⚠️ 색이 정보를 나른다. 글자를 읽기 전에 「채팅이구나 / 제재구나」를 알아채게 하는
 * 장치라, 여덟 종류를 한 색으로 뭉개면 목록이 그냥 같은 줄 열 개로 보인다.
 * 아이콘 모양만으로는 36px 원 안에서 구별이 잘 안 된다 — 색이 먼저 눈에 띈다.
 * 그래서 「보기 좋으라고」가 아니라 「구별하라고」 있는 값이다. 하나로 줄이지 말 것.
 *
 * 값의 출처: 웹 src/components/header/components/notification-section/
 * notificationIconClass.ts. 웹은 Tailwind 클래스로 적혀 있어서, 실제 색은 두 군데를
 * 봐야 나온다.
 *  - `stroke-[#2563EB]` 처럼 대괄호에 박힌 것은 그 16진값 그대로다.
 *  - `bg-blue-100` · `stroke-gray-400` 처럼 이름으로 적힌 것은 토큰을 따라가야 한다.
 *    회색 둘은 이 프로젝트가 src/styles/tokens.colors.css에서 Tailwind 기본값을
 *    덮어썼다(gray-100 #F3F4F6→#E5E7EB, gray-400 #99A1AF→#A0AEC0). 나머지는
 *    Tailwind v4 기본 팔레트(oklch)를 sRGB로 옮긴 값이다.
 * 웹의 토큰이 바뀌면 여기도 같이 고쳐야 한다 — 앱은 CSS를 못 읽어서 자동으로 따라오지 않는다.
 */
export const NOTIFICATION_COLORS: Record<NotificationType, { bg: string; icon: string }> = {
  // 채팅 둘은 같은 파랑을 쓴다(웹도 같다) — 「채팅」이라는 한 갈래로 읽히게 하려고.
  CHAT_NEW_ROOM: { bg: '#DBEAFE', icon: '#2563EB' },
  CHAT_NEW_MESSAGE: { bg: '#DBEAFE', icon: '#2563EB' },
  PRODUCT_FAVORITE_STATUS_CHANGED: { bg: '#FCE7F3', icon: '#EC4899' },
  PRODUCT_FAVORITE_PRICE_CHANGED: { bg: '#FEF9C2', icon: '#EAB308' },
  ADMIN_SANCTION: { bg: '#FFE2E2', icon: '#DC2626' },
  // 지워진 글은 이미 끝난 일이라 유일하게 무채색이다 — 눈에 덜 띄는 게 맞다.
  POST_DELETED: { bg: '#E5E7EB', icon: '#A0AEC0' },
  COMMENT_REPLY: { bg: '#F3E8FF', icon: '#9333EA' },
  POST_COMMENT: { bg: '#E0E7FF', icon: '#6366F1' },
};

interface Page {
  content: NotificationItem[];
  hasNext: boolean;
}

/** 알림 한 페이지. 웹과 같이 열 개씩 가져온다. */
export async function fetchNotifications(page: number): Promise<Page> {
  const res = await apiFetch(`/notifications?page=${page}&size=10`);
  if (!res.ok) throw new Error(`알림을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: Partial<Page> };
  return {
    content: body.data?.content ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

/**
 * 안 읽은 개수.
 *
 * 실패해도 던지지 않는다 — 이 값은 헤더의 점 하나를 켜고 끄는 데만 쓴다.
 * 여기서 던지면 조회 실패가 홈 화면 전체를 오류로 만든다.
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await apiFetch('/notifications/unread-count');
    if (!res.ok) return 0;
    const body = (await res.json()) as { data?: { unreadCount?: number } };
    return body.data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: number): Promise<void> {
  await apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'PATCH' });
}

/**
 * 알림을 눌렀을 때 갈 곳.
 *
 * kind가 'app'이면 앱 화면으로 옮기고, 'web'이면 앱 안 브라우저로 웹 주소를 연다.
 * 채팅(12바퀴)·커뮤니티(9바퀴) 화면이 앱에 아직 없어서 나뉜다. 그 바퀴들이 지나면
 * 여기만 고치면 된다 — 화면 쪽은 안 건드려도 된다.
 *
 * 규칙은 웹 src/lib/utils/getNavigationPath.ts와 같다.
 */
export function resolveTarget(
  item: NotificationItem
): { kind: 'app'; path: string } | { kind: 'web'; path: string } {
  const { relatedEntityType, relatedEntityId, notificationType } = item;

  if (relatedEntityId !== null) {
    if (relatedEntityType === 'PRODUCT')
      return { kind: 'app', path: `/products/${relatedEntityId}` };
    if (relatedEntityType === 'CHAT_ROOM') return { kind: 'web', path: `/chat/${relatedEntityId}` };
    if (relatedEntityType === 'POST')
      return { kind: 'web', path: `/community/${relatedEntityId}` };
  }

  if (notificationType === 'ADMIN_SANCTION') return { kind: 'app', path: '/(tabs)/(my)' };
  if (notificationType === 'POST_DELETED') return { kind: 'web', path: '/community' };

  return { kind: 'app', path: '/(tabs)/(home)' };
}
