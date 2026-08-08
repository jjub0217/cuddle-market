import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronDown } from 'lucide-react-native';

import type { Option } from '@cuddle/shared';

import { messageStyles } from '@/components/signup/field';
import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';
import { FieldLabel } from '@/components/ui/field-label';
import { colors } from '@/constants/colors';

// 값 하나를 아래에서 올라오는 목록으로 고르는 칸.
// 앱에는 웹의 <select> 같은 요소가 없어서, 누르면 시트가 올라오는 방식으로 만든다.
//
// 모양(테두리·높이·글자 크기)은 region-field.tsx의 고르는 칸과 **같은 값**을 쓴다.
// 한 화면에 두 칸이 나란히 서는데 모양이 다르면 안 된다.

interface Props {
  /**
   * 칸 위 이름표 — 「반려동물 종류」 같은 것.
   *
   * 안 넘기면 이름표를 아예 안 그린다. 칸 둘이 한 이름표를 나눠 쓰는 자리가 있어서다 —
   * 웹 PetTypeField도 「반려동물 종류」 하나를 두고 그 아래 셀렉트 둘(대분류·소분류)을 놓는다.
   * 빈 글자를 넘기는 길로 두지 않은 이유: 안드로이드에서 빈 Text가 한 줄 높이를 먹어
   * 칸 사이가 벌어진다.
   */
  label?: string;
  /** 필수 칸이면 이름표 뒤에 빨간 별표를 붙인다 */
  required?: boolean;
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
  required,
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
      {label ? <FieldLabel text={label} required={required} /> : null}

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
        {/* 「눌러서 고르는 칸」이라는 표시. 없으면 글자를 치는 칸처럼 보인다 —
            웹도 SelectDropdown에 같은 아이콘(lucide ChevronDown)을 그린다 */}
        <ChevronDown size={18} color={colors.onSurfaceMuted} strokeWidth={2} />
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
  // 이름표 모양은 ui/field-label.tsx가 들고 있다
  select: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    // 글자는 왼쪽, 화살표는 오른쪽 끝
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.surface,
  },
  selectPressed: { opacity: 0.7 },
  selectDisabled: { backgroundColor: colors.surfaceMuted },
  selectError: { borderColor: colors.danger },
  value: { flex: 1, fontSize: 15, color: colors.onSurface },
  placeholder: { flex: 1, fontSize: 15, color: colors.onSurfaceSubtle },

  // 세부 종류가 가장 길어야 여덟 개지만, 카테고리·상태까지 한 껍데기를 쓰므로
  // region-field와 같이 여섯 줄에서 끊는다. 화면을 다 덮지 않게 하려는 것이다.
  list: { maxHeight: 56 * 6 },
});
