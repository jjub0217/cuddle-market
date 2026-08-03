import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Option } from '@cuddle/shared';

import { messageStyles } from '@/components/signup/field';
import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';

// 값 하나를 아래에서 올라오는 목록으로 고르는 칸.
// 앱에는 웹의 <select> 같은 요소가 없어서, 누르면 시트가 올라오는 방식으로 만든다.
//
// 모양(테두리·높이·글자 크기)은 region-field.tsx의 고르는 칸과 **같은 값**을 쓴다.
// 한 화면에 두 칸이 나란히 서는데 모양이 다르면 안 된다.

interface Props {
  /** 칸 위 이름표 — 「반려동물 종류」 같은 것 */
  label: string;
  /** 안 골랐을 때 회색으로 보이는 글 — 「카테고리를 선택해주세요」 */
  placeholder: string;
  value: string;
  options: readonly Option[];
  error?: string;
  /** 아직 못 고르는 상태(세부 종류는 대분류를 골라야 열린다) */
  disabled?: boolean;
  /** 못 고르는 이유 — 「먼저 대분류를 선택해주세요」 */
  disabledHint?: string;
  onChange: (code: string) => void;
}

export function PickerField({
  label,
  placeholder,
  value,
  options,
  error,
  disabled = false,
  disabledHint,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  // 앞 칸이 입력칸이면 키보드가 올라와 있다. 안 내리면 올라온 목록을 키보드가 덮는다.
  // region-field.tsx도 같은 이유로 여기서 직접 내린다.
  const openSheet = () => {
    Keyboard.dismiss();
    setOpen(true);
  };

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  // 화면에는 코드가 아니라 한글을 보여준다. 목록에 없는 코드면 빈 값처럼 다룬다.
  const selected = options.find((option) => option.code === value);
  const text = selected?.label ?? (disabled ? (disabledHint ?? placeholder) : placeholder);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        disabled={disabled}
        style={({ pressed }) => [
          styles.select,
          error ? styles.selectError : null,
          disabled && styles.selectDisabled,
          pressed && !disabled && styles.selectPressed,
        ]}
      >
        <Text style={selected ? styles.value : styles.placeholder}>{text}</Text>
      </Pressable>

      {error ? <Text style={messageStyles.error}>{error}</Text> : null}

      {/* 거주지·마이페이지 시트와 같은 껍데기를 쓴다 — 시트마다 모양이 다르면 안 된다. */}
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <ScrollView style={styles.list}>
          {options.map((option, index) => (
            <Pressable
              key={option.code}
              onPress={() => pick(option.code)}
              accessibilityRole="button"
              style={({ pressed }) => [
                sheetItemStyles.item,
                index > 0 && sheetItemStyles.itemDivider,
                pressed && sheetItemStyles.itemPressed,
              ]}
            >
              <Text style={sheetItemStyles.label}>{option.label}</Text>
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

  // 세부 종류가 가장 길어야 여덟 개지만, 카테고리·상태까지 한 껍데기를 쓰므로
  // region-field와 같이 여섯 줄에서 끊는다. 화면을 다 덮지 않게 하려는 것이다.
  list: { maxHeight: 56 * 6 },
});
