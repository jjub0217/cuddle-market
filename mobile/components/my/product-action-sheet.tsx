import { Pressable, StyleSheet, Text } from 'react-native';

import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';

// 카드의 ⋮ 로 여는 하단 시트.
//
// 왜 가운데 모달이 아닌가:
// 목록 항목마다 뜨는 메뉴라 한 손으로 닿는 아래쪽이 맞고, 위험한 항목(삭제)을
// 화면 한가운데가 아니라 아래로 떨어뜨려 둘 수 있다.
//
// 이 컴포넌트는 무엇을 보일지 모른다 — 항목 목록을 받아 그리기만 한다.
// 어떤 항목을 보일지는 lib/product-menu.ts가 정한다.
//
// 껍데기(모달·애니메이션·모서리·덮개)는 components/ui/bottom-sheet.tsx로 뺐다.
// 회원가입의 거주지 선택이 같은 모양을 써야 해서다.

export interface SheetAction {
  label: string;
  /** danger는 되돌릴 수 없는 동작(삭제)에만 쓴다. */
  tone?: 'default' | 'danger';
  onPress: () => void;
}

interface Props {
  visible: boolean;
  actions: SheetAction[];
  onClose: () => void;
}

export function ProductActionSheet({ visible, actions, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {actions.map((action, index) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [
            sheetItemStyles.item,
            index > 0 && sheetItemStyles.itemDivider,
            pressed && sheetItemStyles.itemPressed,
          ]}
        >
          <Text style={[sheetItemStyles.label, action.tone === 'danger' && styles.labelDanger]}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  labelDanger: {
    color: '#DC2626',
  },
});
