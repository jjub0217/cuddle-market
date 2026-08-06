import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  type Option,
} from '@cuddle/shared';

// 상품 목록 위에 얹는 필터 세 줄 (반려동물 대분류 · 소분류 · 카테고리).
//
// 값·모양은 새로 짓지 않는다 — 알약은 components/places/category-tabs.tsx와 같다
// (선택=#825500 브라운 채움, 비선택=흰 배경 + 베이지 테두리 #D4C4B2).
// 카테고리 줄은 웹 CategoryFilter.tsx와 같은 「동그란 그림 + 이름」이다.
//
// 「전체」는 각 줄 맨 앞에 두고 값은 null이다(빈 문자열이나 'ALL'이 아니다) — 서버에 빈 값으로
// 쿼리가 안 실려야 하기 때문이다(mobile/lib/products.ts 쪽 계약, 계획서 Task 1 참고).
//
// 같은 걸 다시 누르면 풀린다(null로 알린다) — 웹과 같은 방식이라 이 조각의 규칙으로 정한다.
//
// 소분류 줄은 **대분류를 골랐을 때만** 그린다. 대분류가 「전체」면 고를 세부가 정해지지 않는다.

const ALL_OPTION_KEY = 'ALL';

// ⚠️ require는 정적이어야 한다 — `require('...' + code)`는 RN에서 안 된다(번들에 안 담긴다).
//    그래서 코드마다 한 줄씩 적는다. 그림은 웹 public/images/category에서 그대로 옮겼고
//    코드 ↔ 파일 짝은 웹 constants.ts의 CATEGORY_ICON_IMAGES와 같다.
//    (require가 돌려주는 건 번들 안 그림 번호다 — 그래서 타입이 number다)
const CATEGORY_ICONS: Record<string, number> = {
  FOOD: require('@/assets/images/category/food.webp'),
  TOY: require('@/assets/images/category/toy.webp'),
  HOUSE: require('@/assets/images/category/house.webp'),
  HEALTH: require('@/assets/images/category/health.webp'),
  CLOTHING: require('@/assets/images/category/clothing.webp'),
  WALKING: require('@/assets/images/category/walking.webp'),
  GROOMING: require('@/assets/images/category/grooming.webp'),
  ETC: require('@/assets/images/category/etc.webp'),
};

interface Props {
  petType: string | null;
  petDetailType: string | null;
  category: string | null;
  onChangePetType: (next: string | null) => void;
  onChangePetDetailType: (next: string | null) => void;
  onChangeCategory: (next: string | null) => void;
}

export function ProductFilterRow({
  petType,
  petDetailType,
  category,
  onChangePetType,
  onChangePetDetailType,
  onChangeCategory,
}: Props) {
  const detailOptions = petType ? (PET_DETAIL_OPTIONS_BY_TYPE[petType] ?? []) : [];

  // 대분류를 바꾸면 고른 소분류를 푼다 — 「포유류/강아지」에서 대분류만 조류로 바꾸면
  // 강아지가 남아 서로 맞지 않는 조건이 서버로 간다.
  const handleChangePetType = (next: string | null) => {
    if (next !== petType && petDetailType !== null) {
      onChangePetDetailType(null);
    }
    onChangePetType(next);
  };

  return (
    <View>
      <FilterPillRow
        selected={petType}
        options={PET_TYPE_OPTIONS}
        onChange={handleChangePetType}
      />
      {detailOptions.length > 0 && (
        <FilterPillRow
          selected={petDetailType}
          options={detailOptions}
          onChange={onChangePetDetailType}
        />
      )}
      <CategoryIconRow selected={category} onChange={onChangeCategory} />
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

interface CategoryIconRowProps {
  selected: string | null;
  onChange: (next: string | null) => void;
}

/**
 * 카테고리는 알약이 아니라 「동그란 그림 + 이름」이다 (웹 CategoryFilter.tsx와 같은 모양).
 *
 * ⚠️ **여기엔 「전체」가 없다.** 아무것도 안 고른 상태가 곧 전체이고, 되돌릴 때는
 *    고른 것을 다시 누르면 풀린다. 웹도 그렇다 —
 *    `CategoryFilter.tsx:17-26`이 여덟 개만 그리고 재클릭으로 해제한다.
 *    (앞줄 알약은 글자라 「전체」가 자연스럽지만, 그림 줄에 「전체」 그림을 지어낼 이유는 없다)
 */
function CategoryIconRow({ selected, onChange }: CategoryIconRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.iconRow}
    >
      {CATEGORY_OPTIONS.map((option) => {
        const active = option.code === selected;
        return (
          <CategoryTile
            key={option.code}
            label={option.label}
            icon={CATEGORY_ICONS[option.code]}
            active={active}
            onPress={() => onChange(active ? null : option.code)}
          />
        );
      })}
    </ScrollView>
  );
}

interface CategoryTileProps {
  label: string;
  icon: number;
  active: boolean;
  onPress: () => void;
}

function CategoryTile({ label, icon, active, onPress }: CategoryTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.tileCircle, active && styles.tileCircleActive]}>
        {/* 이름은 동그라미 아래에 따로 붙으므로 그림에는 대체글을 안 준다 — 두 번 읽힌다 */}
        <Image source={icon} style={styles.tileImage} contentFit="cover" accessibilityLabel="" />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.tileLabel, active ? styles.tileLabelActive : styles.tileLabelIdle]}
      >
        {label}
      </Text>
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
  iconRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 32,
  },
  tile: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  tileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    // 웹 bg-primary-50(#faf3e6)와 같은 연한 베이지
    backgroundColor: '#FAF3E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // 고른 것이 눈에 띄게 — 동그라미에 브라운 테두리를 두르고 이름을 굵게 한다
  tileCircleActive: {
    borderColor: '#825500',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileLabel: {
    fontSize: 12,
  },
  tileLabelActive: {
    color: '#825500',
    fontWeight: '700',
  },
  tileLabelIdle: {
    color: '#4B5563',
    fontWeight: '400',
  },
});
