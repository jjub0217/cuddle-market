import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 카드의 ⋮ 로 여는 하단 시트.
//
// 왜 가운데 모달이 아닌가:
// 목록 항목마다 뜨는 메뉴라 한 손으로 닿는 아래쪽이 맞고, 위험한 항목(삭제)을
// 화면 한가운데가 아니라 아래로 떨어뜨려 둘 수 있다.
//
// 이 컴포넌트는 무엇을 보일지 모른다 — 항목 목록을 받아 그리기만 한다.
// 어떤 항목을 보일지는 lib/product-menu.ts가 정한다.

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
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* 취소 버튼을 따로 두지 않는다. 바깥을 누르면 닫힌다. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기">
        {/* 시트 안을 눌렀을 때 닫히지 않도록 바깥 Pressable의 터치를 여기서 멈춘다. */}
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]} onPress={() => {}}>
          {actions.map((action, index) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.item,
                index > 0 && styles.itemDivider,
                pressed && styles.itemPressed,
              ]}
            >
              <Text style={[styles.label, action.tone === 'danger' && styles.labelDanger]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    // 아래는 화면 끝에 붙으므로 위쪽 모서리만 둥글게.
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingTop: 8,
  },
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  itemPressed: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 16,
    color: '#111827',
  },
  labelDanger: {
    color: '#DC2626',
  },
});
