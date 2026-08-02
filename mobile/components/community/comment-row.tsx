import { getTimeAgo, splitMention } from '@cuddle/shared';
import { Image } from 'expo-image';
import { EllipsisVertical } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CommentItem } from '@/lib/community';

// 댓글·답글 한 줄. 웹 CommentItem과 같은 재료·같은 숫자를 쓴다.
//   닉네임 14 · 본문 15(줄 간격 좁게) · 멘션 14 · 답글 상자 패딩 14
//
// 답글은 **들여쓰기로만** 구분한다. 서버가 깊이를 안 나누고 평평하게 주므로
// 들여쓰기도 한 겹뿐이다 — 답글의 답글도 같은 자리에 온다.
//
// ⚠️ 답글에 상자(배경색·안쪽 여백)를 두면 안 된다. 그 여백만큼 ⋮ 가 안으로 밀려
//    댓글의 ⋮ 와 세로로 어긋난다. 오른쪽 끝은 댓글이든 답글이든 한 줄이어야 한다.

interface CommentRowProps {
  comment: CommentItem;
  isReply?: boolean;
  isMine: boolean;
  /**
   * ⋮ — 내 것이면 삭제, 남의 것이면 작성자 신고.
   *
   * 안 넘기면 ⋮ 를 안 그린다 — 웹 CommentItem도 할 일이 없으면 그 자리를 안 그린다.
   */
  onMenu?: () => void;
  /**
   * 「답글 달기」를 눌렀을 때.
   *
   * 부모 댓글은 스레드 화면으로 **옮겨 가고**, 답글은 그 자리에서 칸을 연다.
   * 어느 쪽인지는 부르는 쪽이 정한다 — 이 조각은 누르면 부를 뿐이다.
   * 안 넘기면 「답글 달기」를 안 그린다(웹 CommentItem과 같다).
   */
  onReply?: () => void;
}

export function CommentRow({ comment, isReply = false, isMine, onMenu, onReply }: CommentRowProps) {
  const { mention, rest } = splitMention(comment.content);

  return (
    <View style={[styles.row, isReply && styles.replyRow]}>
      {comment.authorProfileImageUrl ? (
        <Image source={{ uri: comment.authorProfileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{comment.authorNickname.slice(0, 1)}</Text>
        </View>
      )}

      <View style={styles.main}>
        <View style={styles.nameLine}>
          <Text style={styles.name}>{comment.authorNickname}</Text>
          {isMine ? <Text style={styles.mineBadge}>내 댓글</Text> : null}
        </View>

        <Text style={styles.content}>
          {mention ? <Text style={styles.mention}>{mention}</Text> : null}
          {rest}
        </Text>

        <View style={styles.metaLine}>
          <Text style={styles.time}>{getTimeAgo(comment.createdAt)}</Text>
          {onReply ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button">
                <Text style={styles.action}>답글 달기</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      {onMenu ? (
        <Pressable
          onPress={onMenu}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="더보기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <EllipsisVertical size={18} color="#9CA3AF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  // 들여쓰기만. 안쪽 여백을 주면 ⋮ 가 밀려 댓글의 ⋮ 와 어긋난다.
  replyRow: { marginLeft: 40 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, color: '#6B7280' },
  main: { flex: 1, gap: 4 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  mineBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#ecc88e', // 웹 --color-primary-200
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  content: { fontSize: 15, lineHeight: 21, color: '#111827' }, // 웹 leading-snug와 같은 비율
  mention: { fontSize: 14, color: '#825500' }, // 웹 --color-primary-container
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 12, color: '#9CA3AF' },
  dot: { fontSize: 12, color: '#9CA3AF' },
  action: { fontSize: 12, fontWeight: '500', color: '#825500' },
  pressed: { opacity: 0.5 },
});
