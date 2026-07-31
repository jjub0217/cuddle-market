import Feather from '@expo/vector-icons/Feather';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACCOUNT_DELETION_URL, PRIVACY_URL, SUPPORT_MAIL_URL } from '@/lib/support-links';

// 헤더 햄버거(☰)로 여는 전체 화면 메뉴.
//
// 왜 하단 시트가 아니라 오버레이인가:
// 웹 모바일이 전체 화면 오버레이를 쓴다(MobileNavigation). 같은 버튼을 눌렀는데
// 웹과 앱이 다른 모양으로 열리면 같은 서비스로 안 보인다.
// (한때 시트로 만들었다가 되돌렸다 — 항목 수가 적다는 이유였는데, 통일이 먼저다.)
//
// 왜 여기 셋뿐인가:
// 로그인 없이도 닿아야 하는 것은 햄버거, 로그인해야 의미 있는 것은 마이 —
// 가 웹과 앱의 공통 기준이다. 셋 다 로그인과 무관한 안내라 여기 있다.
// 그래서 헤더의 햄버거는 벨과 달리 로그아웃 상태에서도 늘 보인다.
//
// 마이 탭에도 같은 항목이 있다. 웹이 푸터와 모바일 내비 양쪽에 두고 있어 그것을 따랐다 —
// 찾는 사람이 어느 쪽으로 가든 닿아야 한다.

const HEADER_HEIGHT = 52;

interface MenuItem {
  label: string;
  url: string;
}

const ITEMS: MenuItem[] = [
  { label: '고객센터', url: SUPPORT_MAIL_URL },
  { label: '개인정보처리방침', url: PRIVACY_URL },
  { label: '계정 삭제 안내', url: ACCOUNT_DELETION_URL },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AppMenuOverlay({ visible, onClose }: Props) {
  // 열고 나서 오버레이를 닫는다. 앱으로 돌아왔을 때 그대로 떠 있으면
  // 「눌렸나?」 싶어 한 번 더 누르게 된다.
  const open = (url: string) => {
    onClose();
    Linking.openURL(url);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="메뉴 닫기"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <Feather name="x" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.heading}>메뉴</Text>
        </View>

        <View>
          {ITEMS.map((menuItem, index) => (
            <Pressable
              key={menuItem.label}
              onPress={() => open(menuItem.url)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowLabel}>{menuItem.label}</Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  pressed: { opacity: 0.5 },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  rowPressed: { backgroundColor: '#F9FAFB' },
  rowLabel: { fontSize: 16, color: '#111827' },
});
