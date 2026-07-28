import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { logout } from '@/lib/auth/session';

// 로그아웃 확인.
//
// 왜 네이티브 Alert.alert이 아닌가:
// 같은 화면의 탈퇴가 커스텀 모달이라, 나란히 있는 두 줄을 눌렀을 때 창 모양이 갈리면
// 만든 사람이 다른 화면처럼 보인다. 껍데기(덮개 · 카드 · 버튼 두 개)를 탈퇴와 맞춘다.
//
// 확인 버튼 색만 다르다 — 탈퇴는 되돌릴 수 없어 빨강, 로그아웃은 다시 들어오면 되니 검정.

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 로그아웃이 끝났을 때. 보통 홈으로 보낸다. */
  onDone: () => void;
}

export function LogoutModal({ visible, onClose, onDone }: Props) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    // logout()은 던지지 않는다 — 서버 호출이 실패해도 기기 정리는 반드시 끝낸다(session.ts).
    // 그래서 여기엔 오류 표시가 없다.
    await logout(queryClient);

    setSubmitting(false);
    onDone();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>로그아웃</Text>
          <Text style={styles.description}>정말로 로그아웃 하시겠습니까?</Text>

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
                <Text style={styles.confirmLabel}>로그아웃</Text>
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
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
