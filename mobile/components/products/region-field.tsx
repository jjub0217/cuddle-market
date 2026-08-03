import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { messageStyles } from '@/components/signup/field';
import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';

import { CITIES, PROVINCES } from '@/constants/cities';

// 시/도 → 시/군/구를 고르는 칸. 앱에는 웹의 <select> 같은 요소가 없어서, 누르면
// 아래에서 목록이 올라오는 방식으로 만든다. withdraw-modal.tsx가 이미 같은
// 방식(Modal + ScrollView)을 쓴다.
//
// 가입 화면(signup/address-field.tsx)과 상품 등록 화면이 같이 쓴다. 그래서 폼 훅에
// 묶지 않고 값만 주고받는다.

interface Props {
  sido: string;
  gugun: string;
  /** 시도·구군 중 아무거나 잘못됐을 때의 문구 */
  error?: string;
  /** 시도를 바꾸면 구군은 빈 글자로 온다 — 서울 강남구에서 부산으로 바꾸면 강남구가 남으면 안 된다 */
  onChange: (sido: string, gugun: string) => void;
  /** 목록을 열기 전에 키보드를 내린다. 안 내리면 앞 칸에서 올라온 키보드가 목록을 덮는다 */
  onOpen?: () => void;
  /** 칸 이름. 가입은 「거주지」, 상품 등록은 「거래 희망 지역」이다 */
  label?: string;
}

type Sheet = 'sido' | 'gugun';

export function RegionField({ sido, gugun, error, onChange, onOpen, label = '거주지' }: Props) {
  const [open, setOpen] = useState<Sheet | null>(null);

  // keyboardShouldPersistTaps="handled" 때문에 버튼을 눌러도 키보드가 저절로 안 내려간다.
  // 거주지는 입력칸이 아니라 누르는 버튼이라, 직접 내려주지 않으면 계속 덮인 채로 남는다.
  const openSheet = (sheet: Sheet) => {
    Keyboard.dismiss();
    onOpen?.();
    setOpen(sheet);
  };

  const guguns: readonly string[] = sido
    ? ((CITIES as Record<string, readonly string[]>)[sido] ?? [])
    : [];
  const options: readonly string[] = open === 'sido' ? PROVINCES : guguns;

  const pick = (value: string) => {
    if (open === 'sido') {
      // 시/도가 바뀌면 이전 구/군은 더 이상 맞지 않는다. 웹 AddressField도 같이 비운다.
      onChange(value, '');
    } else {
      onChange(sido, value);
    }
    setOpen(null);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => openSheet('sido')}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.select,
          error ? styles.selectError : null,
          pressed && styles.selectPressed,
        ]}
      >
        <Text style={sido ? styles.value : styles.placeholder}>{sido || '시/도를 선택해주세요'}</Text>
      </Pressable>

      <Pressable
        onPress={() => openSheet('gugun')}
        accessibilityRole="button"
        disabled={!sido}
        style={({ pressed }) => [
          styles.select,
          !sido && styles.selectDisabled,
          pressed && sido && styles.selectPressed,
        ]}
      >
        <Text style={gugun ? styles.value : styles.placeholder}>
          {gugun || (sido ? '시/군/구를 선택해주세요' : '먼저 시/도를 선택해주세요')}
        </Text>
      </Pressable>

      {error ? <Text style={messageStyles.error}>{error}</Text> : null}

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
