import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  NOTIFICATION_COLORS,
  NOTIFICATION_ICONS,
  NOTIFICATION_MESSAGES,
  type NotificationItem,
} from '@/lib/notifications';

interface Props {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

/** 「2개월 전」 같은 표기. 분·시간·일·개월만 쓴다 — 초 단위는 알림에 의미가 없다. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  return `${Math.floor(days / 30)}개월 전`;
}

export function NotificationRow({ item, onPress }: Props) {
  // 색은 꾸밈이 아니라 정보다 — 글자를 읽기 전에 알림 종류를 알아채는 장치라서,
  // 여덟 종류를 한 색으로 뭉개면 목록이 구별 안 되는 같은 줄들이 된다.
  // 값과 그 이유는 lib/notifications.ts의 NOTIFICATION_COLORS 주석에 적어 뒀다.
  const color = NOTIFICATION_COLORS[item.notificationType];

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !item.isRead && styles.unread, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: color.bg }]}>
        <IconSymbol
          name={NOTIFICATION_ICONS[item.notificationType]}
          size={20}
          color={color.icon}
        />
      </View>

      <View style={styles.body}>
        {/* 서버 title이 아니라 정해진 문구를 쓴다 — 웹과 같아야 한다 */}
        <Text style={styles.title}>{NOTIFICATION_MESSAGES[item.notificationType]}</Text>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>

      {!item.isRead ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  // 안 읽음: 배경 + 점. 웹과 같은 방식이다.
  unread: { backgroundColor: '#FDF6EC' },
  pressed: { opacity: 0.7 },
  // 배경색은 종류마다 달라서 여기 두지 않는다 — 쓰는 쪽에서 덧씌운다.
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  content: { fontSize: 14, color: '#4B5563' },
  time: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2620A',
    marginTop: 6,
  },
});
