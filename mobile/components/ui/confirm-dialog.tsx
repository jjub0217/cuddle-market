import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// 「정말 할까요?」를 묻는 창. 로그아웃 확인 창(components/my/logout-modal.tsx)과 같은 결이다.
//
// 왜 조각으로 빼나:
// 차단하기 · 차단 해제가 같은 모양을 각자 그리고 있었고, 그중 하나는 RN 기본 Alert이라
// 창 모양이 갈렸다. 같은 앱에서 확인 창이 두 모양이면 만든 사람이 다른 화면처럼 보인다.
//
// 오류는 여기서 안 다룬다. 부르는 쪽이 토스트로 알린다 —
// 실패 문구가 화면마다 다르고, 창이 닫힌 뒤에도 보여야 하기 때문이다.

interface Props {
  visible: boolean;
  heading: string;
  description?: string;
  /** 있으면 회색 상자에 「· 」로 줄줄이 그린다(차단 안내 같은 것). */
  notes?: string[];
  confirmLabel: string;
  /** danger는 되돌리기 어려운 동작(차단·삭제)에만 쓴다. */
  tone?: 'default' | 'danger';
  onClose: () => void;
  /** 던지면 창을 닫지 않는다 — 부르는 쪽이 토스트로 알리고 다시 시도할 수 있게. */
  onConfirm: () => Promise<void>;
}

export function ConfirmDialog({
  visible,
  heading,
  description,
  notes,
  confirmLabel,
  tone = 'default',
  onClose,
  onConfirm,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>{heading}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}

          {notes?.length ? (
            <View style={styles.noteBox}>
              {notes.map((line) => (
                <Text key={line} style={styles.noteLine}>
                  {`· ${line}`}
                </Text>
              ))}
            </View>
          ) : null}

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
              onPress={handleConfirm}
              disabled={submitting}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirm,
                tone === 'danger' && styles.confirmDanger,
                submitting && styles.confirmDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
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
  noteBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  noteLine: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
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
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 웹 BlockModal도 되돌리기 어려운 동작에 bg-danger-600을 쓴다.
  confirmDanger: { backgroundColor: '#DC2626' },
  confirmDisabled: { opacity: 0.5 },
  confirmLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
