import { getTimeAgo } from '@cuddle/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  HeartCrack,
  MessageCircleMore,
  MessageSquarePlus,
  MessageSquareText,
  Reply,
  ShieldAlert,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';

import {
  NOTIFICATION_COLORS,
  NOTIFICATION_MESSAGES,
  resolveUnreadMark,
  type NotificationItem,
  type NotificationType,
} from '@/lib/notifications';

import { colors } from '@/constants/colors';

/**
 * 알림 종류별 아이콘.
 *
 * 웹 src/constants/constants.ts의 `iconMap`과 **같은 Lucide 아이콘**이다.
 * 이름만 비슷한 게 아니라 같은 그림이어야 한다 — 같은 알림이 웹과 앱에서 다르게
 * 보이면 안 된다. 웹의 lucide-react와 앱의 lucide-react-native를 같은 판(0.563.0)으로
 * 묶어 둔 이유이기도 하다. 웹이 아이콘을 바꾸면 여기도 같이 고쳐야 한다.
 *
 * (전에는 Feather를 썼는데 HeartCrack·ShieldAlert·Reply 같은 게 없어서 뜻만 비슷한
 *  다른 그림으로 대신했었다.)
 */
const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  CHAT_NEW_ROOM: MessageSquarePlus,
  CHAT_NEW_MESSAGE: MessageCircleMore,
  PRODUCT_FAVORITE_STATUS_CHANGED: HeartCrack,
  PRODUCT_FAVORITE_PRICE_CHANGED: Tag,
  ADMIN_SANCTION: ShieldAlert,
  POST_DELETED: Trash2,
  COMMENT_REPLY: Reply,
  POST_COMMENT: MessageSquareText,
};

interface Props {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

// 시각 표기는 shared의 getTimeAgo를 쓴다(웹 NotificationItem도 같다).
//
// 여기 같은 일을 하는 함수를 따로 두고 있었는데, 시간대가 없는 시각을 `new Date(iso)`로
// 그냥 읽었다. 서버는 시간대 없이 **UTC** 시각을 주므로 한국에서는 9시간이 빠졌다 —
// 방금 온 알림이 「9시간 전」으로 보였다. getTimeAgo는 그때 `Z`를 붙여 준다.

export function NotificationRow({ item, onPress }: Props) {
  // 색은 꾸밈이 아니라 정보다 — 글자를 읽기 전에 알림 종류를 알아채는 장치라서,
  // 여덟 종류를 한 색으로 뭉개면 목록이 구별 안 되는 같은 줄들이 된다.
  // 값과 그 이유는 lib/notifications.ts의 NOTIFICATION_COLORS 주석에 적어 뒀다.
  const color = NOTIFICATION_COLORS[item.notificationType];
  const Icon = NOTIFICATION_ICONS[item.notificationType];
  // 점이냐 숫자냐 아무것도 아니냐는 lib/notifications.ts가 정한다(시험이 덮고 있다).
  const mark = resolveUnreadMark(item);

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !item.isRead && styles.unread, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: color.bg }]}>
        <Icon size={20} color={color.icon} />
      </View>

      <View style={styles.body}>
        {/* 서버 title이 아니라 정해진 문구를 쓴다 — 웹과 같아야 한다 */}
        <Text style={styles.title}>{NOTIFICATION_MESSAGES[item.notificationType]}</Text>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
      </View>

      {mark.kind === 'dot' ? <View style={styles.dot} /> : null}
      {mark.kind === 'count' ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mark.text}</Text>
        </View>
      ) : null}
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
    borderBottomColor: colors.surfaceSunken,
    backgroundColor: colors.surface,
  },
  // 안 읽음: 배경 + 점. 웹과 같은 방식이다.
  // 웹 NotificationItem과 같은 값이다 — --color-primary-50.
  // 같은 화면이 두 곳에서 다른 색이면 안 된다.
  unread: { backgroundColor: colors.brandSurface },
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
  title: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  content: { fontSize: 14, color: colors.onSurfaceMedium },
  time: { fontSize: 12, color: colors.onSurfaceSubtle, marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // 웹의 안 읽음 점과 같은 값 — --color-primary-500
    backgroundColor: colors.brand500,
    marginTop: 6,
  },
  // 묶인 채팅이 여럿일 때 점 대신 그린다. 모양은 채팅 목록의 방 뱃지와 같다
  // (components/chat/chat-room-row.tsx) — 같은 뜻의 뱃지가 화면마다 다르면 안 된다.
  // 20px짜리라 제목 줄 높이와 맞아서 점처럼 따로 내려 줄 필요가 없다.
  //
  // ⚠️ **바탕색을 위의 점과 같은 brand500 으로 맞추지 말 것.** 두 갈색이 달라 보여
  //    맞추고 싶어지는데, 그러면 **안의 글자가 안 읽힌다.**
  //      brand500 #B06F15  흰 글자 대비 4.09:1  ← 11px 글자에는 모자라다
  //      action   #825500  흰 글자 대비 6.46:1  ← 통과
  //    점은 속이 빈 도형이라 대비를 안 따져도 되지만 뱃지는 안에 글자가 들어간다.
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
