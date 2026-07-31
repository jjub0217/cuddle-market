import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CITIES, PROVINCES } from '@/constants/cities';
import type { useSignupForm } from '@/lib/signup/use-signup-form';

// 거주지. 앱에는 웹의 <select> 같은 요소가 없어서, 누르면 아래에서 목록이
// 올라오는 방식으로 만든다. withdraw-modal.tsx가 이미 같은 방식(Modal + ScrollView)을 쓴다.
//
// 웹에서도 필수다 — CascadingSelectField가 Controller에 required 규칙을 걸어 제출을 막는다.

interface Props {
  form: ReturnType<typeof useSignupForm>;
}

type Sheet = 'sido' | 'gugun';

export function AddressField({ form }: Props) {
  const { values, errors } = form;
  const [open, setOpen] = useState<Sheet | null>(null);

  const guguns: readonly string[] = values.addressSido
    ? ((CITIES as Record<string, readonly string[]>)[values.addressSido] ?? [])
    : [];
  const options: readonly string[] = open === 'sido' ? PROVINCES : guguns;

  const pick = (value: string) => {
    if (open === 'sido') {
      form.setValue('addressSido', value);
      // 시/도가 바뀌면 이전 구/군은 더 이상 맞지 않는다. 웹 AddressField도 같이 비운다.
      form.setValue('addressGugun', '');
    } else {
      form.setValue('addressGugun', value);
    }
    setOpen(null);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>거주지</Text>

      <Pressable
        onPress={() => setOpen('sido')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.select,
          errors.addressSido ? styles.selectError : null,
          pressed && styles.selectPressed,
        ]}
      >
        <Text style={values.addressSido ? styles.value : styles.placeholder}>
          {values.addressSido || '시/도를 선택해주세요'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setOpen('gugun')}
        accessibilityRole="button"
        disabled={!values.addressSido}
        style={({ pressed }) => [
          styles.select,
          !values.addressSido && styles.selectDisabled,
          pressed && values.addressSido && styles.selectPressed,
        ]}
      >
        <Text style={values.addressGugun ? styles.value : styles.placeholder}>
          {values.addressGugun ||
            (values.addressSido ? '시/군/구를 선택해주세요' : '먼저 시/도를 선택해주세요')}
        </Text>
      </Pressable>

      {errors.addressSido ? <Text style={styles.error}>{errors.addressSido}</Text> : null}

      <Modal
        visible={open !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{open === 'sido' ? '시/도' : '시/군/구'}</Text>
          <ScrollView>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => pick(option)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <Text style={styles.optionLabel}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, color: '#6B7280' },
  select: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectPressed: { opacity: 0.7 },
  selectDisabled: { backgroundColor: '#F9FAFB' },
  selectError: { borderColor: '#DC2626' },
  value: { fontSize: 15, color: '#111827' },
  placeholder: { fontSize: 15, color: '#9CA3AF' },
  error: { fontSize: 13, color: '#DC2626' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  option: { paddingVertical: 14 },
  optionPressed: { opacity: 0.6 },
  optionLabel: { fontSize: 15, color: '#111827' },
});
