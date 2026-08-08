import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { CATEGORIES, type PlaceCategory } from '@/lib/places/types';

// 카테고리 알약 넷(동물병원 · 카페 · 식당 · 숙소). CATEGORIES 순서를 그대로 따른다.
//
// 마이 목록의 상태 칩(components/my/status-filter-chips.tsx)과 같은 꼴로 맞춘다 —
// 선택=#825500(브라운) 채움, 비선택=흰 배경 + 베이지 테두리(#D4C4B2). 새 색을 짓지 않는다.
//
// 그 칩은 줄바꿈(flexWrap)이지만 여기는 가로 스크롤이다: 이 칸은 지도 위에 얹혀서
// 세로 공간이 귀하다 — 두 줄로 넘어가면 지도가 그만큼 줄어든다.

interface Props {
  selected: PlaceCategory;
  onSelect: (category: PlaceCategory) => void;
}

export function CategoryTabs({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((category) => {
        const active = category.key === selected;
        return (
          <Pressable
            key={category.key}
            onPress={() => onSelect(category.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
              {category.label}
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
    paddingVertical: 12,
  },
  chip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  chipIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
  },
  labelActive: {
    color: colors.onSelected,
    fontWeight: '600',
  },
  labelIdle: {
    color: colors.onSurfaceMedium,
  },
  pressed: {
    opacity: 0.7,
  },
});
