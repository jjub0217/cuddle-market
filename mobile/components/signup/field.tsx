import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

// 라벨 + 입력칸 + 오류문구 한 벌. 회원가입 화면의 칸이 전부 이 모양이다.
// 색·크기는 login-form.tsx의 styles를 그대로 따른다 — 두 화면이 달라 보이면 안 된다.

interface Props extends TextInputProps {
  label: string;
  /** 오류가 있으면 문구를, 없으면 undefined */
  error?: string;
  /** 오른쪽에 붙는 버튼 등 */
  trailing?: ReactNode;
  /** 칸 아래 회색 안내문. 오류가 있으면 오류가 우선한다 */
  hint?: string;
  /** 초록 성공 문구(중복체크 통과 등). 오류가 있으면 오류가 우선한다 */
  success?: string;
}

export function Field({ label, error, trailing, hint, success, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.grow, error ? styles.inputError : null, style]}
          placeholderTextColor="#9CA3AF"
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? <Text style={messageStyles.error}>{error}</Text> : null}
      {!error && success ? <Text style={messageStyles.success}>{success}</Text> : null}
      {!error && !success && hint ? <Text style={messageStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

// 칸 아래 문구. 웹 회원가입과 같은 값을 쓴다(InputField.tsx: text-xs font-semibold).
// 색은 웹 토큰 그대로다 — tokens.colors.css에 WCAG AA 대비를 맞춘 값이라고 적혀 있다.
// 표시 기호도 웹과 같이 이모지가 아닌 ✓(U+2713)를 쓴다. 이모지는 기기마다 모양이 다르다.
export const messageStyles = StyleSheet.create({
  error: { fontSize: 12, fontWeight: '600', color: '#C91D1D' },
  success: { fontSize: 12, fontWeight: '600', color: '#15803D' },
  hint: { fontSize: 12, color: '#6B7280' },
});

/** 칸 오른쪽에 붙는 버튼 모양. 여러 조각이 같이 쓴다. */
export const fieldStyles = StyleSheet.create({
  button: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

const styles = StyleSheet.create({
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  grow: { flex: 1 },
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
  },
  inputError: { borderColor: '#C91D1D' },
});
