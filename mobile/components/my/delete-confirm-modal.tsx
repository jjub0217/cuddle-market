import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

// 삭제 확인. 탈퇴 모달과 같은 껍데기(가운데 · 모서리 8 · 확인 버튼 빨강)를 쓴다.
//
// 상품 제목을 보여주는 이유:
// 목록에서 ⋮ 를 누른 뒤라 어느 카드였는지 헷갈리기 쉽다. 되돌릴 수 없는 동작이니
// 무엇을 지우는지 눈으로 확인시킨다. 웹도 확인 모달에 제목·가격·사진을 띄운다.

interface Props {
  visible: boolean;
  productTitle: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  visible,
  productTitle,
  submitting,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>상품 삭제</Text>
          <Text style={styles.title} numberOfLines={2}>
            {productTitle}
          </Text>
          <Text style={styles.description}>삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</Text>

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
              onPress={onConfirm}
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
                <Text style={styles.confirmLabel}>삭제</Text>
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
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.onSurface,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  description: {
    fontSize: 14,
    color: colors.onSurfaceMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancel: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
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
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onDanger,
  },
  pressed: {
    opacity: 0.7,
  },
});
