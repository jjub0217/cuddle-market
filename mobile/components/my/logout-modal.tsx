import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { logout } from '@/lib/auth/session';

// 로그아웃 확인.
//
// 왜 네이티브 Alert.alert이 아닌가:
// 같은 화면의 탈퇴가 커스텀 모달이라, 나란히 있는 두 줄을 눌렀을 때 창 모양이 갈리면
// 만든 사람이 다른 화면처럼 보인다.
//
// 글자를 가운데로 두는 건 웹의 같은 창(src/components/modal/LoginModal.tsx)에 맞춘 것이다.
// 문구 두 줄도 웹과 글자까지 같다. 확인 버튼 색은 웹이 브랜드 갈색(#825500)이지만 여기선
// 아직 검정이다 — 앱 색을 웹 토큰에 매핑하는 일은 이번 범위 밖이라 별도로 다룬다.
//
// 탈퇴 모달은 왼쪽 정렬 그대로다. 거기는 사유 목록·상세 입력·동의 체크가 줄줄이 있어서
// 가운데로 모으면 읽는 흐름이 흐트러진다. 짧은 확인 창만 가운데로 둔다.

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
                <ActivityIndicator color={colors.onAction} />
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
    backgroundColor: colors.surface,
    // 8은 앱에서 가장 많이 쓰는 값이자 웹 모달(rounded-lg)과 같은 값이다.
    // 카드류가 쓰는 16과 구분된다 — 카드는 웹도 rounded-2xl(16)이라 그쪽이 맞다.
    borderRadius: 8,
    padding: 20,
    gap: 10,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
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
    borderColor: colors.outlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  confirm: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onAction,
  },
  pressed: {
    opacity: 0.7,
  },
});
