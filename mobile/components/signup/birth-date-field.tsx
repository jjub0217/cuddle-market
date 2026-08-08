import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FieldLabel } from '@/components/ui/field-label';
import { colors } from '@/constants/colors';

import { messageStyles } from './field';

// 생년월일. 웹과 같이 YYYY / MM / DD 세 칸으로 받는다(BirthDateField.tsx:74,87,100).
// 날짜 선택기를 쓰면 폰에서는 더 편하지만 새 의존성이 늘고 웹과 모양이 갈린다.
//
// 가입 화면과 「추가 정보 입력」 화면이 같이 쓴다. 그래서 폼 훅에 묶지 않고 값만 주고받는다
// (11바퀴에 RegionField에 한 것과 같다).

interface Props {
  year: string;
  month: string;
  day: string;
  /** 세 칸을 하나로 보므로 오류도 하나다 */
  error?: string;
  onChange: (part: 'year' | 'month' | 'day', value: string) => void;
  onFocus?: TextInputProps['onFocus'];
  /** 필수 칸이면 이름표 뒤에 빨간 별표 */
  required?: boolean;
}

/** 숫자만 남기고 자리수를 자른다. 웹 BirthDateField와 같은 방식이다. */
function digits(text: string, max: number): string {
  return text.replace(/[^0-9]/g, '').slice(0, max);
}

export function BirthDateField({ year, month, day, error, onChange, onFocus, required }: Props) {
  return (
    <View style={styles.field}>
      <FieldLabel text="생년월일" required={required} />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.year, error ? styles.inputError : null]}
          value={year}
          onChangeText={(text) => onChange('year', digits(text, 4))}
          onFocus={onFocus}
          placeholder="YYYY"
          placeholderTextColor={colors.onSurfaceSubtle}
          keyboardType="number-pad"
          maxLength={4}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={month}
          onChangeText={(text) => onChange('month', digits(text, 2))}
          onFocus={onFocus}
          placeholder="MM"
          placeholderTextColor={colors.onSurfaceSubtle}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={day}
          onChangeText={(text) => onChange('day', digits(text, 2))}
          onFocus={onFocus}
          placeholder="DD"
          placeholderTextColor={colors.onSurfaceSubtle}
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
      {error ? <Text style={messageStyles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  // 이름표 모양은 ui/field-label.tsx가 들고 있다
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  inputError: { borderColor: colors.danger },
  year: { flex: 2 },
  part: { flex: 1 },
});
