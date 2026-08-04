import type { ReactNode, RefObject } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FieldLabel } from '@/components/ui/field-label';

// 라벨 + 입력칸 + 오류문구 한 벌. 회원가입 화면의 칸이 전부 이 모양이다.
// 색·크기는 login-form.tsx의 styles를 그대로 따른다 — 두 화면이 달라 보이면 안 된다.

interface Props extends TextInputProps {
  label: string;
  /** 필수 칸이면 이름표 뒤에 빨간 별표를 붙인다 */
  required?: boolean;
  /** 오류가 있으면 문구를, 없으면 undefined */
  error?: string;
  /** 오른쪽에 붙는 버튼 등 */
  trailing?: ReactNode;
  /** 칸 아래 회색 안내문. 오류가 있으면 오류가 우선한다 */
  hint?: string;
  /** 안내문 색. 시간이 얼마 안 남았을 때처럼 눈에 띄어야 하면 'danger' */
  hintTone?: 'muted' | 'danger';
  /** 초록 성공 문구(중복체크 통과 등). 오류가 있으면 오류가 우선한다 */
  success?: string;
  /**
   * 입력칸 손잡이. 바깥에서 커서를 이 칸으로 옮길 때 쓴다
   * (상품 폼이 막힌 칸으로 화면을 옮기며 커서도 같이 옮긴다).
   */
  inputRef?: RefObject<TextInput | null>;
}

export function Field({
  label,
  required,
  error,
  trailing,
  hint,
  hintTone = 'muted',
  success,
  style,
  inputRef,
  ...inputProps
}: Props) {
  return (
    <View style={styles.field}>
      <FieldLabel text={label} required={required} />
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={[styles.input, styles.grow, error ? styles.inputError : null, style]}
          placeholderTextColor="#9CA3AF"
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? <Text style={messageStyles.error}>{error}</Text> : null}
      {!error && success ? <Text style={messageStyles.success}>{success}</Text> : null}
      {!error && !success && hint ? (
        <Text style={hintTone === 'danger' ? messageStyles.error : messageStyles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

// 칸 아래 문구(오류·성공·안내).
//
// ⚠️ 크기는 웹과 **일부러 다르다.** 웹은 text-xs(12px)인데 앱은 13px이다 —
//    11바퀴 실기기 확인에서 폰으로는 12px이 눈에 안 들어와 한 단계 올렸다.
//    셋을 같은 값으로 두는 이유: 한 자리에 번갈아 뜨는 문구라 크기가 다르면 글자가 들썩인다.
//
// 색은 웹 토큰 그대로다 — tokens.colors.css에 WCAG AA 대비를 맞춘 값이라고 적혀 있다.
// 표시 기호도 웹과 같이 이모지가 아닌 ✓(U+2713)를 쓴다. 이모지는 기기마다 모양이 다르다.
export const messageStyles = StyleSheet.create({
  error: { fontSize: 13, fontWeight: '600', color: '#C91D1D' },
  success: { fontSize: 13, fontWeight: '600', color: '#15803D' },
  hint: { fontSize: 13, color: '#6B7280' },
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
  // 이름표 모양은 ui/field-label.tsx가 들고 있다 — 여러 칸이 같은 값을 써야 해서다
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: '#C91D1D' },
});
