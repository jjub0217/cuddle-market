import { getTimeAgo } from '@cuddle/shared';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ChatRoomListItem } from '@/lib/chat/api';

// 채팅 목록의 한 줄. 웹 ChatRooms.tsx 와 같은 것을 보여준다 —
// 상대 닉네임 · 마지막 메시지 · 지난 시간 · 안 읽은 개수 · 상품 사진.

/**
 * 마지막 메시지 자리에 넣을 글자.
 *
 * ⚠️ 타입은 `string` 이지만 **서버는 세 가지를 보낸다.** 웹도 그래서 셋으로 갈라 쓴다
 * (`ChatRooms.tsx`). 문구는 웹에서 그대로 가져왔다.
 *
 * ```
 * null   아직 아무도 말을 안 걸었다 → 「채팅방에 입장해주세요」
 * ''     사진만 보냈다 (글자가 없다) → 「사진」
 * 그 밖   그 글자를 그대로
 * ```
 */
function lastMessageText(lastMessage: string): string {
  const text: string | null = lastMessage;
  if (text == null) return '채팅방에 입장해주세요';
  if (text === '') return '사진';
  return text;
}

interface Props {
  room: ChatRoomListItem;
  onPress: () => void;
}

export function ChatRoomRow({ room, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {/* CDN 이미지라 next/image 규칙과 무관하다. RN 은 Image 하나뿐이다. */}
      <Image source={{ uri: room.productImageUrl }} style={styles.thumb} />
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.nickname} numberOfLines={1}>
            {room.opponentNickname}
          </Text>
          {/* ⚠️ 시각이 없으면 아예 안 그린다. 빈 값을 getTimeAgo 에 넣으면
              「NaN.NaN.NaN」이 그대로 찍힌다 — 웹도 같은 이유로 감싸 두었다. */}
          {room.lastMessageTime ? (
            <Text style={styles.time}>{getTimeAgo(room.lastMessageTime)}</Text>
          ) : null}
        </View>
        <Text style={styles.last} numberOfLines={1}>
          {lastMessageText(room.lastMessage)}
        </Text>
      </View>
      {room.unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{room.unreadCount > 99 ? '99+' : room.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.85 },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surfaceSunken },
  body: { flex: 1, gap: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nickname: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.onSurface },
  time: { fontSize: 12, color: colors.onSurfaceSubtle },
  last: { fontSize: 13, color: colors.onSurfaceMuted },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.onAction },
});
