import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Option } from '@cuddle/shared';

import { messageStyles } from '@/components/signup/field';
import { FieldLabel } from '@/components/ui/field-label';
import { colors } from '@/constants/colors';

// 값 하나를 **펼쳐 놓고** 고르는 칸. 웹 ProductStateFilter(variant="pill")와 같은 모양이다.
//
// 왜 시트(PickerField)를 안 쓰나: 상품 상태는 값이 넷이고 글자가 짧다. 시트로 감추면
// 무엇을 고를 수 있는지 열어 봐야 알고, 손도 두 번 간다(열고 → 고르고).
// 값이 많은 칸(카테고리·지역)은 그대로 시트가 맞다 — 펼치면 화면을 다 덮는다.
//
// ⚠️ 색은 **일단** 앱의 회색 계열만 쓴다. 웹은 갈색·베이지(--color-primary-container #825500,
//    --color-outline-variant #D4C4B2)를 쓰지만 앱에는 아직 안 들인다.
//    고른 것을 알아볼 수 있으면 되고, 브랜드 색을 앱 어디까지 쓸지는 따로 정한다.

interface Props {
  label: string;
  /** 필수 칸이면 이름표 뒤에 빨간 별표를 붙인다 */
  required?: boolean;
  value: string;
  options: readonly Option[];
  error?: string;
  onChange: (code: string) => void;
}

export function ChipField({ label, required, value, options, error, onChange }: Props) {
  return (
    <View style={styles.field}>
      <FieldLabel text={label} required={required} />

      {/* 여럿 중 하나를 고르는 자리라 radio로 알린다. 읽어 주는 기기가 「4개 중 2번째」로 읽는다 */}
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((option) => {
          const active = option.code === value;

          return (
            <Pressable
              key={option.code}
              onPress={() => onChange(option.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={active ? styles.labelActive : styles.labelInactive}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={messageStyles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  // 넷이 한 줄에 안 들어가면 다음 줄로 넘어간다. 폰 폭에서는 두 줄이 된다
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: {
    // 높이를 못 박지 않는다 — 기기 글자 크기를 키운 사람에게 글자가 잘리면 안 된다.
    // 대신 위아래 여백으로 손이 닿을 자리를 만든다(웹 py-2와 같은 값)
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  // 고른 것은 진한 회색으로 채운다. 테두리 색은 입력칸과 같은 값이다
  chipActive: { backgroundColor: colors.action, borderColor: colors.action },
  chipInactive: { backgroundColor: colors.surface, borderColor: colors.outline },
  chipPressed: { opacity: 0.7 },

  labelActive: { fontSize: 13, fontWeight: '700', color: colors.onAction },
  labelInactive: { fontSize: 13, fontWeight: '700', color: colors.onSurfaceMuted },
});
