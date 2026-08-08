import { COMMUNITY_REPORT_REASON, PRODUCT_REPORT_REASON, USER_REPORT_REASON } from '@cuddle/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { reportPost } from '@/lib/community';
import { isAlreadyReported, reportProduct, reportUser } from '@/lib/reports';
import { showToast } from '@/lib/toast';

// 신고 화면. 상품용과 사용자용과 게시글용을 한 화면이 다 그린다 —
// 사유 목록과 보낼 주소만 다르고 나머지가 같아서, 화면을 나누면 같은 코드가 두 벌이 된다.
//
// 왜 모달이 아니라 전체 화면인가:
// 앱의 다른 「집중해서 끝내는 화면」(로그인 · 회원가입 · 알림)이 다 전체 화면이고,
// 좁은 폭에서 모달에 라디오 8개 + 글상자를 넣으면 세로로 눌린다.
// 그래서 루트 스택에 둔다 — 탭바까지 덮어야 한다.
//
// 당근처럼 「사유 목록 화면 → 상세 입력 화면」 두 단계로 쪼개지는 않는다. 그러려면
// 사유마다 부제 문구를 새로 지어야 하는데, 우리 상수에는 라벨만 있다.

const DETAIL_MAX = 300; // 웹 ReportApiErrors.detailReason.maxLength와 같은 값

export default function ReportScreen() {
  const router = useRouter();
  const { kind, id, name } = useLocalSearchParams<{
    kind: 'product' | 'user' | 'post';
    id: string;
    name?: string;
  }>();

  const targetId = Number(id);
  const reasons =
    kind === 'product'
      ? PRODUCT_REPORT_REASON
      : kind === 'post'
        ? COMMUNITY_REPORT_REASON
        : USER_REPORT_REASON;

  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reasonCode || submitting) return;
    setSubmitting(true);

    try {
      if (kind === 'product') {
        await reportProduct(targetId, reasonCode, detail);
      } else if (kind === 'post') {
        await reportPost(targetId, reasonCode, detail);
      } else {
        await reportUser(targetId, reasonCode, detail);
      }
      // 화면이 통째로 바뀌므로 "됐다"는 신호가 없으면 눌렀는지 모른다.
      // 웹은 모달만 닫고 아무 말이 없지만, 여기는 매체가 달라 일부러 다르게 간다.
      //
      // 확인 창이 아니라 토스트인 이유: 사용자가 할 일이 없는 알림이다.
      // [확인]을 한 번 더 누르게 하면 성공했는데 손이 더 간다.
      router.back();
      showToast('신고가 접수되었습니다');
    } catch (error) {
      // 실패해도 화면을 안 닫는다 — 고른 사유와 쓴 글이 남아 있어야 다시 낼 수 있다.
      const already = isAlreadyReported(error);
      showToast(
        already
          ? kind === 'product'
            ? '이미 신고한 상품입니다'
            : kind === 'post'
              ? '이미 신고한 게시글입니다'
              : '이미 신고한 사용자입니다'
          : '신고에 실패했습니다'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 끝내고 나가는 화면이라 뒤로(‹)가 아니라 닫기(✕)다 */}
      <ScreenHeader
        title={
          kind === 'product' ? '상품 신고하기' : kind === 'post' ? '게시글 신고하기' : '사용자 신고하기'
        }
        icon="close"
        onPressIcon={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {name ? (
          <Text style={styles.description}>
            {kind === 'product'
              ? `"${name}" 상품을 신고합니다.`
              : kind === 'post'
                ? `"${name}" 게시글을 신고합니다.`
                : `${name}님을 신고합니다.`}
          </Text>
        ) : null}

        <Text style={styles.label}>
          신고 사유 <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.reasonBox}>
          {reasons.map((reason, index) => (
            <Pressable
              key={reason.id}
              onPress={() => setReasonCode(reason.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reasonCode === reason.id }}
              style={({ pressed }) => [
                styles.reasonRow,
                index > 0 && styles.reasonDivider,
                pressed && styles.pressedRow,
              ]}
            >
              <Text style={styles.reasonLabel}>{reason.label}</Text>
              {reasonCode === reason.id ? <Check size={20} color={colors.onSurface} /> : null}
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>신고 상세 사유 (선택)</Text>
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="신고 상세 사유를 입력해주세요."
          placeholderTextColor={colors.onSurfaceSubtle}
          multiline
          maxLength={DETAIL_MAX}
          style={styles.detailInput}
        />
        <Text style={styles.counter}>
          {detail.length}/{DETAIL_MAX}자
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={!reasonCode || submitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submit,
            (!reasonCode || submitting) && styles.submitDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onAction} />
          ) : (
            <Text style={styles.submitLabel}>신고하기</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  pressed: { opacity: 0.5 },
  pressedRow: { backgroundColor: colors.surfaceMuted },
  body: { padding: 16, gap: 8, paddingBottom: 24 },
  description: { fontSize: 14, color: colors.onSurfaceMuted, marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '600', color: colors.onSurface, marginTop: 8 },
  required: { color: colors.danger },
  reasonBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    borderRadius: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  reasonDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceSunken,
  },
  reasonLabel: { fontSize: 15, color: colors.onSurface },
  detailInput: {
    minHeight: 110,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 12, color: colors.onSurfaceSubtle, alignSelf: 'flex-end' },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  submit: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 15, fontWeight: '600', color: colors.onAction },
});
