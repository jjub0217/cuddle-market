import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { createChatRoom } from '@/lib/chat/api';
import { showToast } from '@/lib/toast';

// 웹 ProductActions.tsx 와 같다 — 내 상품이 아닐 때만 보이고, 문구는 「채팅하기」다.
// 이미 방이 있으면 서버가 그 방을 돌려줘서 새로 안 생긴다.

export function ChatButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const chatRoomId = await createChatRoom(productId);
      router.push(`/chat/${chatRoomId}`);
    } catch {
      // 웹 문구 그대로
      showToast('채팅방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={start}
      disabled={busy}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {busy ? (
        <ActivityIndicator color={colors.onAction} />
      ) : (
        <Text style={styles.label}>채팅하기</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 너비는 감싸는 쪽이 정한다(찜 단추와 반씩 나눠 가진다).
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
  pressed: { opacity: 0.85 },
  label: { fontSize: 15, fontWeight: '600', color: colors.onAction },
});
