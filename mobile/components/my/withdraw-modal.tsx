import { WITH_DRAW_ALERT_LIST } from '@cuddle/shared';
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

import { Check } from 'lucide-react-native';

import { colors } from '@/constants/colors';
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

/**
 * 탈퇴 안내. 원본은 @cuddle/shared 에 있고 웹도 같은 것을 쓴다.
 *
 * 전에는 이 파일이 두 줄을 따로 들고 있었는데, 둘 다 서버가 하지 않는 일이었다
 * (상품 삭제 · 거래·채팅 기록 삭제). 사실대로 고치면서 웹과 한 곳으로 모았다(#832) —
 * 각자 들고 있으면 다음에 또 한쪽만 고치게 된다.
 */
const ALERTS = WITH_DRAW_ALERT_LIST;

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
    } catch (caught) {
      // 실패해도 세션은 그대로다(session.ts). 모달을 닫지 않고 다시 시도할 수 있게 둔다.
      //
      // ⚠️ 예전에는 오류를 통째로 버리고 「잠시 후 다시」만 보여 줬다. 그러면 사용자도
      //    우리도 무엇이 잘못됐는지 알 길이 없다 — 실기기에서 탈퇴가 안 될 때 원인을
      //    좁히지 못했다(2026-08-04). 세션이 풀린 경우는 갈라서 알리고,
      //    나머지는 상태 코드를 함께 보여 준다.
      const detail = caught instanceof Error ? caught.message : '';

      if (detail.includes('401')) {
        setError('로그인이 풀렸어요. 다시 로그인한 뒤 시도해주세요.');
      } else {
        setError(`탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요. ${detail}`.trim());
      }
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

            {/* 안내가 넷으로 늘면서 모달 전체가 스크롤되기 시작했다(#832). 높이를 여기서 막고
                넘치는 만큼은 이 상자 안에서만 스크롤한다 — 사유·동의·단추는 늘 제자리에 있다.
                nestedScrollEnabled 는 안드로이드에서 필요하다. 없으면 바깥 ScrollView 가
                손짓을 다 가져가 이 상자가 안 움직인다. */}
            <ScrollView
              style={styles.alertBox}
              contentContainerStyle={styles.alertBoxContent}
              nestedScrollEnabled
            >
              {ALERTS.map((text) => (
                // 불릿과 글을 따로 둔다. 「· 글」을 한 Text 에 넣으면 줄바꿈된 줄이 불릿 **밑**으로
                // 들어가 목록이 흐트러진다. 글만 flex: 1 로 두면 둘째 줄도 첫 줄 글자에 맞춰 선다.
                <View key={text} style={styles.alertRow}>
                  <Text style={styles.alertBullet}>·</Text>
                  <Text style={styles.alertText}>{text}</Text>
                </View>
              ))}
            </ScrollView>

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
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {/* 선택 표시는 안을 꽉 채우지 않고 가운데 점으로 — 흔히 보는 라디오 모양. */}
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
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
              placeholderTextColor={colors.onSurfaceSubtle}
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
              {/* 체크했을 때 ✓ 가 보여야 한다. 네모만 채우면 「무엇이 켜진 건지」가 안 읽힌다 */}
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed ? <Check size={12} color={colors.onAction} strokeWidth={3} /> : null}
              </View>
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
                  <ActivityIndicator color={colors.onAction} />
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
    backgroundColor: colors.surface,
    // 로그아웃 모달과 같은 값. 두 창이 한 화면에서 나란히 열리므로 어긋나면 바로 보인다.
    borderRadius: 8,
  },
  sheetContent: {
    padding: 20,
    gap: 10,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.onSurface,
  },
  description: {
    fontSize: 14,
    color: colors.onSurfaceMuted,
  },
  alertBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    // 안내 넷을 다 펴면 모달이 화면을 넘긴다. 여기서 끊고 안에서 스크롤한다.
    // flexGrow: 0 이 없으면 ScrollView 가 남은 자리를 다 차지하려 든다.
    //
    // 100 은 **줄 한가운데에서 잘리도록** 고른 값이다. 줄 끝에 딱 맞춰 자르면 아래에
    // 글이 더 있다는 것이 안 보여서, 스크롤해 볼 생각을 못 하고 지나친다.
    //
    //   위 여백 12 + 두 줄짜리 36 + 사이 4 + 두 줄짜리 36 + 사이 4 = 92
    //   여기서 8 을 더 두면 다음 줄의 **윗부분만** 걸쳐 보인다
    //
    // 글자 크기(13)나 줄 높이(18)를 바꾸면 이 값도 같이 다시 잡아야 한다.
    maxHeight: 100,
    flexGrow: 0,
  },
  alertBoxContent: {
    padding: 12,
    gap: 4,
    // 아래 여백만 넉넉히. 끝까지 내렸을 때 마지막 줄이 상자 밑변에 붙지 않는다
    paddingBottom: 14,
  },
  alertRow: {
    flexDirection: 'row',
    // 불릿을 첫 줄에 맞춰 세운다. center 로 두면 두 줄짜리에서 불릿이 가운데로 내려간다
    alignItems: 'flex-start',
    gap: 6,
  },
  // 줄 높이를 글과 같게 맞춰야 불릿이 첫 글자와 같은 줄에 선다
  alertBullet: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceMuted,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
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
    backgroundColor: colors.surfaceSunken,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.selected,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.selected,
  },
  reasonLabel: {
    fontSize: 15,
    color: colors.onSurface,
  },
  textarea: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.onSurface,
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
    borderColor: colors.outline,
    // ✓ 를 가운데에 놓는다
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.selected,
    backgroundColor: colors.selected,
  },
  agreeLabel: {
    fontSize: 14,
    color: colors.onSurface,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
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
    backgroundColor: colors.danger,
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
