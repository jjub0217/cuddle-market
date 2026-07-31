import { Linking, Pressable, Text } from 'react-native';

import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';
import { ACCOUNT_DELETION_URL, PRIVACY_URL, SUPPORT_MAIL_URL } from '@/lib/support-links';

// 헤더 햄버거(☰)로 여는 시트.
//
// 왜 하단 시트인가:
// 담을 게 셋뿐이라 웹처럼 화면을 다 덮는 오버레이는 과하다. 앱에는 이미 같은 모양의
// 시트 껍데기가 있어서(components/ui/bottom-sheet.tsx, 7바퀴에 상품 메뉴·거주지 선택과
// 공용화) 새로 만들 이유가 없다 — 세 시트가 따로 놀면 같은 앱으로 안 보인다.
//
// 왜 여기 셋뿐인가:
// 로그인 없이도 닿아야 하는 것은 햄버거, 로그인해야 의미 있는 것은 마이 —
// 가 웹과 앱의 공통 기준이다. 셋 다 로그인과 무관한 안내라 여기 있다.
// 그래서 헤더의 햄버거는 벨과 달리 로그아웃 상태에서도 늘 보인다.

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

export function AppMenuSheet({ visible, onClose }: Props) {
  // 열고 나서 시트를 닫는다. 앱으로 돌아왔을 때 시트가 그대로 떠 있으면
  // 「눌렸나?」 싶어 한 번 더 누르게 된다.
  const open = (url: string) => {
    onClose();
    Linking.openURL(url);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {ITEMS.map((menuItem, index) => (
        <Pressable
          key={menuItem.label}
          onPress={() => open(menuItem.url)}
          accessibilityRole="button"
          style={({ pressed }) => [
            sheetItemStyles.item,
            index > 0 && sheetItemStyles.itemDivider,
            pressed && sheetItemStyles.itemPressed,
          ]}
        >
          <Text style={sheetItemStyles.label}>{menuItem.label}</Text>
        </Pressable>
      ))}
    </BottomSheet>
  );
}
