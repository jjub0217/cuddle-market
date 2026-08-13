import { formatChatTime } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer/photo-viewer';
import { colors } from '@/constants/colors';
import type { ChatMessage } from '@/lib/chat/api';

// 말풍선 하나. 네 갈래다 — 안내(SYSTEM) · 막힌 내 메시지 · 사진(IMAGE) · 보통.
// 웹 ChatLog.tsx 의 갈래와 같다.
//
// ⚠️ **사진을 안 그리면 빈 말풍선이 뜬다.** 사진 메시지는 content 가 비어 있고 imageUrl 에만
//    값이 있다. 앱에서 보낼 길이 없던 동안에도 **웹에서 보낸 사진은 이미 오고 있었다**(#900).

/** 사진 말풍선. 못 불러오면 자리만 남긴다 — 웹도 자리표시자를 둔다(ChatLog 의 ChatImageMessage). */
function ImageMessage({ uri, mine }: { uri: string | null; mine: boolean }) {
  const [failed, setFailed] = useState(false);
  // 확대창(#904). 말풍선 안 사진은 정사각으로 **잘려** 있어서, 누르면 잘린 곳까지 다 보인다.
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <View style={[styles.photo, mine ? styles.photoMine : styles.photoTheirs]}>
      {uri && !failed ? (
        <>
          <Pressable
            testID="chat-photo"
            accessibilityRole="button"
            onPress={() => setViewerOpen(true)}
            style={styles.photoImage}>
            <Image
              source={{ uri }}
              style={styles.photoImage}
              contentFit="cover"
              // 읽어 주는 이름이 없으면 화면 낭독기가 「그림」이라고만 읽는다.
              accessibilityLabel={mine ? '내가 보낸 사진' : '받은 사진'}
              onError={() => setFailed(true)}
            />
          </Pressable>
          {/* 채팅 사진은 한 장씩 오므로 누른 것만 띄운다(상품 상세처럼 여러 장이 아니다). */}
          <PhotoViewer images={[uri]} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
        </>
      ) : (
        // 못 불러온 자리 — 띄울 사진이 없으니 누를 수도 없다. 기존 그대로 둔다.
        <View style={styles.photoFallback}>
          <Text style={styles.photoFallbackText}>사진을 불러오지 못했어요</Text>
        </View>
      )}
    </View>
  );
}

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
        {/* 막힌 것도 내가 보낸 것이라 내 말풍선과 같은 모양으로 둔다. */}
        <Text selectable style={[styles.bubble, styles.mine, styles.mineCorner]}>
          {message.content}
        </Text>
        <Text style={styles.blockedNote}>개인정보 포함으로 상대방에게 전송되지 않았습니다.</Text>
      </View>
    );
  }

  // 사진은 말풍선 대신 그림을 그린다. content 는 비어 있다.
  if (message.messageType === 'IMAGE') {
    return (
      <View style={[styles.row, message.isMine ? styles.rowMine : styles.rowTheirs]}>
        <ImageMessage uri={message.imageUrl} mine={message.isMine} />
        <Text style={styles.time}>{formatChatTime(message.createdAt)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, message.isMine ? styles.rowMine : styles.rowTheirs]}>
      {/* 꾹 눌러 복사할 수 있다(#896). 계좌번호·주소처럼 옮겨 적을 것이 오간다.
          시각과 시스템 안내는 안 켠다 — 복사할 값이 아니고, 꾹 누를 때 방해만 된다. */}
      <Text
        selectable
        style={[
          styles.bubble,
          message.isMine ? styles.mine : styles.theirs,
          message.isMine ? styles.mineCorner : styles.theirsCorner,
        ]}>
        {message.content}
      </Text>
      <Text style={styles.time}>{formatChatTime(message.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // 웹은 w-48(192) · md 에서 w-72 인데, 폰에는 큰 화면이 없어 한 값으로 둔다.
  // 정사각이다 — 세로로 긴 사진이 대화를 통째로 밀어내지 않게(웹도 aspect-square).
  photo: { width: 192, height: 192, borderRadius: 12, overflow: 'hidden' },
  // 말풍선과 같은 쪽 모서리만 각지게 — 글자 말풍선과 나란히 놓았을 때 결이 맞는다
  photoMine: { borderTopRightRadius: 4 },
  photoTheirs: { borderTopLeftRadius: 4 },
  photoImage: { width: '100%', height: '100%' },
  photoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  photoFallbackText: { fontSize: 12, color: colors.onSurfaceMuted },
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
  // 모서리는 웹과 같다(ChatLog.tsx:248~251). **보낸 쪽을 향한 위 모서리만 각지다** —
  // 내 것은 오른쪽 위, 상대 것은 왼쪽 위. 네 귀를 다 둥글리면 알약이 되어
  // 어느 쪽이 보냈는지가 모양으로 안 읽힌다.
  // 16 은 웹 rounded-2xl(1rem)과 같은 값이다.
  bubble: {
    maxWidth: '72%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  mineCorner: { borderTopRightRadius: 0 },
  theirsCorner: { borderTopLeftRadius: 0 },
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
