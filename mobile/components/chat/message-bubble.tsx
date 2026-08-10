import { formatChatTime } from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ChatMessage } from '@/lib/chat/api';

// 말풍선 하나. 세 갈래다 — 안내(SYSTEM) · 막힌 내 메시지 · 보통.
// 웹 ChatLog.tsx 의 갈래와 같다.

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.messageType === 'SYSTEM') {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.system}>{message.content}</Text>
      </View>
    );
  }

  // 개인정보가 들어 있어 서버가 막은 메시지. **보낸 사람에게만 온다** —
  // 받는 쪽에서는 서버가 아예 걸러낸다. 표시가 없으면 보낸 쪽에는 정상으로 보이고
  // 상대는 못 받아 「읽씹당했다」고 오해한다.
  if (message.isBlocked) {
    return (
      <View style={styles.blockedWrap}>
        <Text style={[styles.bubble, styles.mine]}>{message.content}</Text>
        <Text style={styles.blockedNote}>개인정보 포함으로 상대방에게 전송되지 않았습니다.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, message.isMine ? styles.rowMine : styles.rowTheirs]}>
      <Text style={[styles.bubble, message.isMine ? styles.mine : styles.theirs]}>
        {message.content}
      </Text>
      <Text style={styles.time}>{formatChatTime(message.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // 줄은 화면 폭을 다 쓴다. 그래야 안에서 왼쪽·오른쪽으로 몰 수 있다.
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  // ⚠️ **`row-reverse` 는 가로축의 방향을 뒤집는다.** 「시작」이 오른쪽, 「끝」이 왼쪽이다.
  //    그래서 오른쪽에 붙이려면 `flex-end` 가 아니라 **`flex-start`** 다.
  //    거꾸로 적으면 말풍선 안쪽 차례([시각][말풍선])는 맞는데 줄만 왼쪽에 몰려서,
  //    「내 것으로 판별을 못 하나」로 잘못 보인다. 20바퀴에 실제로 그랬다.
  //    (웹은 ml-auto 라 방향과 무관하게 오른쪽에 붙는다 — 그래서 웹은 멀쩡했다.)
  rowMine: { flexDirection: 'row-reverse', justifyContent: 'flex-start' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '72%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  // 웹 말풍선과 같은 색이다. constants/colors.ts 에 brandText 로 이미 있다(웹 primary-700).
  // 글자는 onAction(흰색) — 진한 바탕 위의 글자라 단추와 같은 짝이다.
  mine: { backgroundColor: colors.brandText, color: colors.onAction },
  theirs: { backgroundColor: colors.surfaceSunken, color: colors.onSurface },
  time: { fontSize: 11, color: colors.onSurfaceSubtle },
  systemWrap: { alignItems: 'center', paddingVertical: 12 },
  system: {
    fontSize: 13,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSunken,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  blockedWrap: { alignItems: 'flex-end', gap: 2, paddingHorizontal: 12, paddingVertical: 3 },
  blockedNote: { fontSize: 12, color: colors.onSurfaceMuted },
});
