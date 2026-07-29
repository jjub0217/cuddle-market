import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { TradeStatus } from '@/lib/product-actions';

// 목록 위 상태 필터. 웹의 Tabs variant="card-pill"과 같은 모양이다.
//
// 왜 드롭다운이 아닌가:
// 선택지가 넷뿐이라 한 줄에 다 보이고, 목록을 훑다가 바꾸는 동작이 한 번에 끝난다.
// 드롭다운은 열고 → 고르는 두 번이 든다.

export type StatusFilter = 'ALL' | TradeStatus;

export interface FilterChip {
  id: StatusFilter;
  label: string;
}

interface Props {
  chips: FilterChip[];
  activeId: StatusFilter;
  onChange: (id: StatusFilter) => void;
}

export function StatusFilterChips({ chips, activeId, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    // 웹 선택 칩과 같은 브랜드 브라운. 앱 브레드크럼 · 등록 버튼이 이미 쓰는 값이다.
    backgroundColor: '#633F00',
    borderColor: '#633F00',
  },
  chipIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#633F00',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelIdle: {
    color: '#633F00',
  },
  pressed: {
    opacity: 0.7,
  },
});
