import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { withdraw } from '@/lib/auth/session';

// 회원 탈퇴. 웹 WithdrawModal과 같은 항목(사유 · 상세사유 · 주의사항 · 동의)을 담는다.
//
// 사유 선택만 방식이 다르다: 웹은 <select> 드롭다운이지만 RN엔 그런 기본 요소가 없다.
// 5개뿐이라 목록으로 펼치는 편이 탭 수도 적고 라이브러리도 필요 없다.

/** 웹 src/constants/constants.ts 의 WITHDRAW_REASON 과 같은 값. 서버가 아는 코드다. */
const WITHDRAW_REASONS = [
  { id: 'SERVICE_DISSATISFACTION', label: '서비스 불만족' },
  { id: 'PRIVACY_CONCERN', label: '개인정보 우려' },
  { id: 'LOW_USAGE', label: '사용 빈도 낮음' },
  { id: 'COMPETITOR', label: '경쟁 서비스 이용' },
  { id: 'OTHER', label: '기타' },
] as const;

/** 웹 WITH_DRAW_ALERT_LIST 와 같은 안내. */
const ALERTS = ['등록한 모든 상품이 삭제됩니다', '거래 내역과 채팅 기록이 모두 삭제됩니다'];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 탈퇴가 끝났을 때. 보통 홈으로 보낸다. */
  onDone: () => void;
}

export function WithdrawModal({ visible, onClose, onDone }: Props) {
  const queryClient = useQueryClient();

  const [reason, setReason] = useState<string>(WITHDRAW_REASONS[0].id);
  const [detailReason, setDetailReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(WITHDRAW_REASONS[0].id);
    setDetailReason('');
    setAgreed(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!agreed || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      await withdraw(queryClient, { reason, detailReason: detailReason.trim() });
      reset();
      onDone();
    } catch {
      // 실패해도 세션은 그대로다(session.ts). 모달을 닫지 않고 다시 시도할 수 있게 둔다.
      setError('탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.heading}>회원탈퇴</Text>
            <Text style={styles.description}>정말로 탈퇴하시겠습니까?</Text>

            <View style={styles.alertBox}>
              {ALERTS.map((text) => (
                <Text key={text} style={styles.alertText}>
                  · {text}
                </Text>
              ))}
            </View>

            <Text style={styles.label}>탈퇴 사유</Text>
            <View style={styles.reasonList}>
              {WITHDRAW_REASONS.map((item) => {
                const selected = item.id === reason;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setReason(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      selected && styles.reasonRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                    <Text style={styles.reasonLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>탈퇴 상세 사유</Text>
            <TextInput
              style={styles.textarea}
              value={detailReason}
              onChangeText={setDetailReason}
              placeholder="탈퇴 사유를 입력해주세요."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Pressable
              onPress={() => setAgreed((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              style={({ pressed }) => [styles.agreeRow, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
              <Text style={styles.agreeLabel}>회원 탈퇴에 동의합니다.</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
              >
                <Text style={styles.cancelLabel}>취소</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!agreed || submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.confirm,
                  (!agreed || submitting) && styles.confirmDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLabel}>탈퇴하기</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  sheetContent: {
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
  alertBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#6B7280',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  reasonList: {
    gap: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  reasonRowSelected: {
    backgroundColor: '#F3F4F6',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  reasonLabel: {
    fontSize: 15,
    color: '#111827',
  },
  textarea: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkboxChecked: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  agreeLabel: {
    fontSize: 14,
    color: '#111827',
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
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
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
