import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { PRIVACY_URL, TERMS_URL } from '@/lib/support-links';

// 가입할 때 받는 필수 동의 둘(#1088).
//
// 왜 받나: 약관규제법 제3조가 계약을 맺을 때 약관을 밝히라고 정한다. 회원가입이 곧
// 이용계약 체결이다. 웹 `ConsentFields.tsx` 와 **같은 문구**를 쓴다 — 화면마다 말이
// 다르면 같은 것을 다르게 약속하는 꼴이 된다.
//
// ⚠️ **앱에는 체크박스 조각이 없었다.** 그래서 여기서 만든다. 눌리는 넓이를 라벨까지
//    넓힌 이유는 네모만 누르게 하면 손가락으로 맞히기 어렵기 때문이다.
//
// 「보기」는 웹 페이지를 연다 — 주소는 `lib/support-links.ts` 에 있는 것을 그대로 쓴다.
// 앱에 약관 본문을 복사해 두면 문구가 바뀔 때마다 스토어 심사를 다시 받아야 한다
// (그 판단은 support-links.ts 머리에 적혀 있다).

export interface ConsentState {
  terms: boolean;
  privacy: boolean;
}

const CONSENTS = [
  { key: 'terms', label: '이용약관에 동의합니다.', url: TERMS_URL, linkLabel: '이용약관 보기' },
  {
    key: 'privacy',
    label: '개인정보처리방침에 동의합니다.',
    url: PRIVACY_URL,
    linkLabel: '개인정보처리방침 보기',
  },
] as const;

interface Props {
  value: ConsentState;
  onChange: (key: keyof ConsentState, next: boolean) => void;
}

export function ConsentCheckboxes({ value, onChange }: Props) {
  return (
    <View style={styles.list}>
      {CONSENTS.map((consent) => {
        const checked = value[consent.key];
        return (
          <View key={consent.key} style={styles.row}>
            <Pressable
              onPress={() => onChange(consent.key, !checked)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={`필수. ${consent.label}`}
              style={styles.hit}
            >
              <View style={[styles.box, checked && styles.boxChecked]}>
                {/* 이모지가 아니라 글자다 — 기기마다 모양이 달라진다
                    (`password-checklist.tsx` 와 같은 판단). */}
                {checked ? <Text style={styles.mark}>✓</Text> : null}
              </View>
              <Text style={styles.label}>
                {consent.label}
                <Text style={styles.required}>*</Text>
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void Linking.openURL(consent.url)}
              accessibilityRole="link"
              accessibilityLabel={consent.linkLabel}
              style={styles.viewHit}
            >
              <Text style={styles.viewLabel}>보기</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // 라벨까지 눌리게 한다. 네모(20px)만 누르게 하면 손끝으로 맞히기 어렵다.
  hit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.action, borderColor: colors.action },
  mark: { color: colors.onAction, fontSize: 13, lineHeight: 16, fontWeight: '700' },
  label: { flex: 1, fontSize: 14, color: colors.onSurface },
  required: { color: colors.danger },
  viewHit: { paddingVertical: 4, paddingHorizontal: 4 },
  viewLabel: { fontSize: 14, color: colors.onSurfaceMuted, textDecorationLine: 'underline' },
});
