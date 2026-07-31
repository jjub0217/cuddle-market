import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import type { useSignupForm } from '@/lib/signup/use-signup-form';

// 생년월일. 웹과 같이 YYYY / MM / DD 세 칸으로 받는다(BirthDateField.tsx:74,87,100).
// 날짜 선택기를 쓰면 폰에서는 더 편하지만 새 의존성이 늘고 웹과 모양이 갈린다.

interface Props {
  form: ReturnType<typeof useSignupForm>;
  onFocus?: TextInputProps['onFocus'];
}

/** 숫자만 남기고 자리수를 자른다. 웹 BirthDateField와 같은 방식이다. */
function digits(text: string, max: number): string {
  return text.replace(/[^0-9]/g, '').slice(0, max);
}

export function BirthDateField({ form, onFocus }: Props) {
  const { values, errors } = form;
  // 세 칸을 합쳐 하나로 보므로 오류도 birthYear 자리에 모아 둔다.
  const error = errors.birthYear;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>생년월일</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.year, error ? styles.inputError : null]}
          value={values.birthYear}
          onChangeText={(text) => form.setValue('birthYear', digits(text, 4))}
          onFocus={onFocus}
          placeholder="YYYY"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={4}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={values.birthMonth}
          onChangeText={(text) => form.setValue('birthMonth', digits(text, 2))}
          onFocus={onFocus}
          placeholder="MM"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={values.birthDay}
          onChangeText={(text) => form.setValue('birthDay', digits(text, 2))}
          onFocus={onFocus}
          placeholder="DD"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  label: { fontSize: 13, color: '#6B7280' },
  input: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  inputError: { borderColor: '#DC2626' },
  year: { flex: 2 },
  part: { flex: 1 },
  error: { fontSize: 13, color: '#DC2626' },
});
