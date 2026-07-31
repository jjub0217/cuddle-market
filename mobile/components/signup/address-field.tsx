import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';

import { CITIES, PROVINCES } from '@/constants/cities';
import type { useSignupForm } from '@/lib/signup/use-signup-form';

import { messageStyles } from './field';

// 거주지. 앱에는 웹의 <select> 같은 요소가 없어서, 누르면 아래에서 목록이
// 올라오는 방식으로 만든다. withdraw-modal.tsx가 이미 같은 방식(Modal + ScrollView)을 쓴다.
//
// 웹에서도 필수다 — CascadingSelectField가 Controller에 required 규칙을 걸어 제출을 막는다.

interface Props {
  form: ReturnType<typeof useSignupForm>;
  /** 목록을 열기 전에 키보드를 내린다. 안 내리면 앞 칸에서 올라온 키보드가 거주지를 덮는다. */
  onOpen?: () => void;
}

type Sheet = 'sido' | 'gugun';

export function AddressField({ form, onOpen }: Props) {
  const { values, errors } = form;
  const [open, setOpen] = useState<Sheet | null>(null);

  // keyboardShouldPersistTaps="handled" 때문에 버튼을 눌러도 키보드가 저절로 안 내려간다.
  // 거주지는 입력칸이 아니라 누르는 버튼이라, 직접 내려주지 않으면 계속 덮인 채로 남는다.
  const openSheet = (sheet: Sheet) => {
    Keyboard.dismiss();
    onOpen?.();
    setOpen(sheet);
  };

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
        onPress={() => openSheet('sido')}
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
        onPress={() => openSheet('gugun')}
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

      {errors.addressSido ? <Text style={messageStyles.error}>{errors.addressSido}</Text> : null}

      {/* 마이페이지의 상품 메뉴 시트와 같은 껍데기를 쓴다 — 두 시트가 따로 놀면 안 된다. */}
      <BottomSheet visible={open !== null} onClose={() => setOpen(null)}>
        <ScrollView style={styles.list}>
          {options.map((option, index) => (
            <Pressable
              key={option}
              onPress={() => pick(option)}
              accessibilityRole="button"
              style={({ pressed }) => [
                sheetItemStyles.item,
                index > 0 && sheetItemStyles.itemDivider,
                pressed && sheetItemStyles.itemPressed,
              ]}
            >
              <Text style={sheetItemStyles.label}>{option}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
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
  selectError: { borderColor: '#C91D1D' },
  value: { fontSize: 15, color: '#111827' },
  placeholder: { fontSize: 15, color: '#9CA3AF' },

  // 시/도 17개 · 구/군은 최대 30개가 넘는다. 화면을 다 덮지 않게 여기서 끊는다.
  list: { maxHeight: 56 * 6 },
});
