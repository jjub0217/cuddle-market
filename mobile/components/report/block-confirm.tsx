import { USER_BLOCK_ALERT_LIST } from '@cuddle/shared';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { blockUser } from '@/lib/reports';

// 차단 확인 창.
//
// 로그아웃 확인 창(components/my/logout-modal.tsx)과 같은 결로 만든다 —
// 같은 앱에서 확인 창 모양이 갈리면 만든 사람이 다른 화면처럼 보인다.
// 다만 안내 줄이 있어 글자는 왼쪽 정렬이다(로그아웃은 한 줄뿐이라 가운데).
//
// 색은 앱이 지금 쓰는 무채색 그대로다. 웹 브랜드 토큰 매핑은 #786에서 다룬다.

interface Props {
  visible: boolean;
  nickname: string;
  userId: number;
  onClose: () => void;
  /** 차단이 끝났을 때. 보통 프로필을 다시 불러온다. */
  onDone: () => void;
}

export function BlockConfirm({ visible, nickname, userId, onClose, onDone }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await blockUser(userId);
      onDone();
    } catch {
      setError('사용자 차단에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>사용자 차단하기</Text>
          <Text style={styles.description}>{`정말로 ${nickname}님을 차단하시겠습니까?`}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* 문구는 @cuddle/shared가 원본이다 — 웹도 같은 것을 쓴다. */}
          <View style={styles.alertBox}>
            {USER_BLOCK_ALERT_LIST.map((line) => (
              <Text key={line} style={styles.alertLine}>
                {`· ${line}`}
              </Text>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirm,
                submitting && styles.confirmDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLabel}>차단하기</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    // 8은 로그아웃 확인 창과 같은 값이다.
    borderRadius: 8,
    padding: 20,
    gap: 10,
  },
  heading: { fontSize: 19, fontWeight: '700', color: '#111827' },
  description: { fontSize: 14, color: '#6B7280' },
  error: { fontSize: 13, color: '#DC2626' },
  alertBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  alertLine: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: { opacity: 0.5 },
  confirmLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
