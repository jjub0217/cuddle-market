import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_OPTIONS, PET_TYPE_OPTIONS, type Option } from '@cuddle/shared';

// 상품 목록 위에 얹는 필터 알약 두 줄 (반려동물 대분류 · 카테고리).
//
// 값·모양은 새로 짓지 않는다 — components/places/category-tabs.tsx와 같은 알약이다
// (선택=#825500 브라운 채움, 비선택=흰 배경 + 베이지 테두리 #D4C4B2).
//
// 「전체」는 각 줄 맨 앞에 두고 값은 null이다(빈 문자열이나 'ALL'이 아니다) — 서버에 빈 값으로
// 쿼리가 안 실려야 하기 때문이다(mobile/lib/products.ts 쪽 계약, 계획서 Task 1 참고).
//
// 같은 걸 다시 누르면 풀린다(null로 알린다) — 웹과 같은 방식이라 이 조각의 규칙으로 정한다.

const ALL_OPTION_KEY = 'ALL';

interface Props {
  petType: string | null;
  category: string | null;
  onChangePetType: (next: string | null) => void;
  onChangeCategory: (next: string | null) => void;
}

export function ProductFilterRow({ petType, category, onChangePetType, onChangeCategory }: Props) {
  return (
    <View>
      <FilterPillRow selected={petType} options={PET_TYPE_OPTIONS} onChange={onChangePetType} />
      <FilterPillRow selected={category} options={CATEGORY_OPTIONS} onChange={onChangeCategory} />
    </View>
  );
}

interface FilterPillRowProps {
  selected: string | null;
  options: readonly Option[];
  onChange: (next: string | null) => void;
}

function FilterPillRow({ selected, options, onChange }: FilterPillRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Pill
        pillKey={ALL_OPTION_KEY}
        label="전체"
        active={selected === null}
        onPress={() => onChange(null)}
      />
      {options.map((option) => {
        const active = option.code === selected;
        return (
          <Pill
            key={option.code}
            pillKey={option.code}
            label={option.label}
            active={active}
            // 고른 걸 다시 누르면 null로 풀어 알린다. 아니면 그 코드로 알린다
            onPress={() => onChange(active ? null : option.code)}
          />
        );
      })}
    </ScrollView>
  );
}

interface PillProps {
  pillKey: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

function Pill({ label, active, onPress }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipIdle,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    // 오른쪽 끝 여백. 딱 맞게 끝나면 뒤에 알약이 더 있는 걸 모른다 — 잘린 게 보여야 한다
    paddingRight: 32,
  },
  chip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: '#825500',
    borderColor: '#825500',
  },
  chipIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4C4B2',
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelIdle: {
    color: '#4B5563',
  },
  pressed: {
    opacity: 0.7,
  },
});
