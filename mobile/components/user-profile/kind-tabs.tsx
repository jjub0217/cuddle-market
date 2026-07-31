import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductKind } from '@/lib/user-profile';

// 프로필의 [판매상품][판매요청] 탭. 웹 USER_PAGE_TABS와 같은 둘이다.
//
// 왜 마이의 StatusFilterChips를 못 쓰나:
// 그건 「거래 상태」(판매중·예약중·판매완료)를 한 목록 안에서 거르는 칩이고,
// 이건 「상품 종류」라 목록 자체가 다르다(주소가 아예 나뉘어 있다).
// 축이 달라서 같은 조각으로 묶으면 둘 다 헷갈린다.
//
// 밑줄형인 이유: 웹도 UnderlineTabs를 쓴다.

const TABS: { id: ProductKind; label: string }[] = [
  { id: 'sell', label: '판매상품' },
  { id: 'request', label: '판매요청' },
];

interface Props {
  activeId: ProductKind;
  onChange: (id: ProductKind) => void;
}

export function KindTabs({ activeId, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#111827' },
  pressed: { opacity: 0.6 },
  label: { fontSize: 15, color: '#9CA3AF' },
  labelActive: { color: '#111827', fontWeight: '700' },
});
