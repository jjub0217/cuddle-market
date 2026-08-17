import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  type Option,
} from '@cuddle/shared';

import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { colors } from '@/constants/colors';

// 상품 목록 위에 얹는 필터 세 줄 (반려동물 대분류 · 소분류 · 카테고리).
//
// ⚠️ **이 파일은 조각을 둘로 내보낸다.** 화면에서 서 있는 자리가 달라서다(#855 후속).
//
//   ProductPetTypeTabs  대분류 탭 — 목록 **밖**에 둔다. 스크롤해도 늘 화면에 남는다
//   ProductFilterRow    소분류 + 카테고리 — 목록의 헤더라 스크롤되어 사라진다
//
// 왜 대분류만 남기나: 정렬·세부 필터는 한 번 정하면 잘 안 바꾸는데 대분류는 계속 오간다
// (「포유류 봤으니 조류도」). 그런데 홈에 「맨 위로」 단추가 없어서, 고정 안 된 것은
// 스크롤을 한참 올려야 닿는다. 그래서 **오가는 축**인 대분류를 남긴다.
// (홈 탭을 다시 누르면 맨 위로 가지만 그건 필터까지 풀려서 이 용도로 못 쓴다)
//
// 줄마다 모양이 다르다 — 하는 일이 달라서다.
//   대분류   글자 탭 + 고른 것 아래 바 (올리브영 홈 상단 탭)  ← 늘 하나가 골라져 있다
//   소분류   알약 (components/places/category-tabs.tsx와 같다)  ← 대분류를 골라야 나온다
//   카테고리 동그란 그림 + 이름, 기기 폭에 맞춰 줄바꿈 (웹 CategoryFilter.tsx)  ← 아무것도 안 고를 수 있다
//
// 「전체」는 대분류·소분류 줄 맨 앞에 두고 값은 null이다(빈 문자열이나 'ALL'이 아니다) —
// 서버에 빈 값으로 쿼리가 안 실려야 하기 때문이다(mobile/lib/products.ts 쪽 계약, 계획서 Task 1 참고).
//
// ⚠️ **다시 눌렀을 때가 줄마다 다르다.**
//   대분류(탭)   안 풀린다. 맨 앞에 「전체」 탭이 있으니 되돌릴 때는 그리로 간다.
//                탭 아래 바는 「지금 여기」를 가리키는 표시라, 눌렀는데 아무 데도 안 가면 어색하다.
//   소분류(알약) 풀린다. 「전체」 알약도 함께 있다 — 알약은 켜고 끄는 것이라 둘 다 된다.
//   카테고리     풀린다. 거긴 「전체」가 아예 없다(아래 CategoryIconGrid 주석 참고).

const ALL_OPTION_KEY = 'ALL';

/**
 * 소분류가 없을 때 돌려주는 **하나뿐인** 빈 배열.
 *
 * ⚠️ 매번 `[]`를 새로 만들면 신원이 달라져, 아래 접힘 애니메이션이 렌더마다 다시 시작한다.
 */
const NO_OPTIONS: readonly Option[] = [];

/**
 * 소분류 줄이 펼쳐졌을 때의 높이.
 *
 * 알약 한 줄이라 높이가 늘 같다 — `styles.chip`의 30 + `styles.row`의 위아래 여백 8+8 = 46.
 * (재서 쓰지 않고 못 박은 이유: 재려면 한 번 그려 본 뒤라야 해서 처음 펼칠 때 한 박자 늦는다.
 *  두 값 중 하나를 고치면 여기도 같이 고쳐야 한다. 시험에도 같은 숫자가 있다.)
 */
const DETAIL_ROW_HEIGHT = 46;

/**
 * 접히고 펼쳐지는 시간.
 *
 * ⚠️ **260ms 로는 안 보였다.** 실기기에서 「전체」로 돌아갈 때만 툭 사라졌는데,
 *    애니메이션이 안 돌아서가 아니라 **목록을 다시 그리는 부하에 묻혀서**였다.
 *    「전체」는 조건이 풀려 상품이 확 늘어나므로 카드를 스무 장 새로 그린다 —
 *    대분류끼리 오갈 때는 목록 크기가 비슷해 안 묻혔다.
 *
 *    1200ms 로 키워 보니 천천히 접히는 게 보였다(애니메이션은 정상). 그래서 묻히지 않을
 *    만큼만 늘려 잡은 값이다. 줄이려면 실기기에서 **「전체」로 돌아가며** 확인할 것 —
 *    대분류끼리만 눌러 보면 260ms 로도 멀쩡해 보인다.
 */
const COLLAPSE_MS = 400;

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

interface PetTypeTabsProps {
  petType: string | null;
  /** 지금 고른 소분류. 대분류를 바꿀 때 이걸 풀어야 하는지 보려고 받는다 */
  petDetailType: string | null;
  onChangePetType: (next: string | null) => void;
  onChangePetDetailType: (next: string | null) => void;
}

/**
 * 대분류 탭 줄. **목록 밖에 두는 조각이다** — 스크롤해도 화면에 남는다.
 *
 * ⚠️ **「대분류를 바꾸면 소분류를 푼다」가 여기 있다.** 대분류를 옮기면서 함께 옮겼다.
 *    두고 왔으면 「조류 + 강아지」처럼 서로 맞지 않는 조건이 서버로 간다.
 *    그래서 소분류를 안 그리면서도 `petDetailType`·`onChangePetDetailType`을 받는다.
 *
 * ⚠️ **자기 흰 배경을 가져야 한다.** 목록 밖으로 나오면 뒤에 홈 배경(#F9FAFB)이 깔린다 —
 *    예전에는 세 줄을 통째로 덮던 바깥 상자가 대신 덮어 줘서 안 보였을 뿐이다.
 *
 * ⚠️ 여기서 `View`로 감싸는 것은 이제 **흰 배경과 표식** 때문이다. 「안쪽 ScrollView의
 *    flexGrow가 살아나 자리를 나눠 갖는다」는 함정은 `UnderlineTabs` 안으로 들어갔다 —
 *    쓰는 쪽이 기억해야 하는 규칙은 또 밟히기 때문이다(#944 과제 2에서 커뮤니티가 밟았다).
 */
export function ProductPetTypeTabs({
  petType,
  petDetailType,
  onChangePetType,
  onChangePetDetailType,
}: PetTypeTabsProps) {
  // 대분류를 바꾸면 고른 소분류를 푼다 — 「포유류/강아지」에서 대분류만 조류로 바꾸면
  // 강아지가 남아 서로 맞지 않는 조건이 서버로 간다.
  const handleChangePetType = (next: string | null) => {
    if (next !== petType && petDetailType !== null) {
      onChangePetDetailType(null);
    }
    onChangePetType(next);
  };

  return (
    <View testID="product-pet-type-tabs" style={styles.sheet}>
      <UnderlineTabs
        selected={petType}
        options={PET_TYPE_OPTIONS}
        onChange={handleChangePetType}
        allLabel="전체"
        // ⚠️ 앞머리를 바꾸면 이 화면의 시험이 한꺼번에 빨개진다. 표식이 곧 약속이다.
        testIDPrefix="pet-type-tab"
      />
    </View>
  );
}

interface Props {
  /** 소분류 목록을 정하는 데 쓴다. 대분류 탭은 위 `ProductPetTypeTabs`가 그린다 */
  petType: string | null;
  petDetailType: string | null;
  category: string | null;
  onChangePetDetailType: (next: string | null) => void;
  onChangeCategory: (next: string | null) => void;
}

/**
 * 소분류 + 카테고리 두 줄. **목록의 헤더라 스크롤되어 사라진다.**
 *
 * ⚠️ 이 둘은 계속 `ListHeaderComponent` 안에 함께 있어야 한다. 자리가 갈리면 React가
 *    조각을 새로 만들어 **소분류 접힘 애니메이션이 죽는다**(2026-08-06 실기기).
 */
export function ProductFilterRow({
  petType,
  petDetailType,
  category,
  onChangePetDetailType,
  onChangeCategory,
}: Props) {
  // 신원이 안 바뀌게 붙잡아 둔다 — 아래 접힘 애니메이션이 이 배열을 보고 움직인다.
  const detailOptions = useMemo(
    () => (petType ? (PET_DETAIL_OPTIONS_BY_TYPE[petType] ?? NO_OPTIONS) : NO_OPTIONS),
    [petType],
  );

  return (
    // ⚠️ 흰 배경을 **줄마다** 준다. 안 주면 뒤에 깔린 홈 배경(#F9FAFB)이 그대로 비쳐
    //    필터 부분만 회색으로 보인다 — 바로 아래 툴바가 흰색이라 더 도드라진다
    //    (2026-08-06 실기기). 접히는 소분류 줄에도 줘야 접힐 때 회색이 안 샌다.
    <View testID="product-filter-row" style={styles.sheet}>
      <CollapsibleDetailRow
        selected={petDetailType}
        options={detailOptions}
        onChange={onChangePetDetailType}
      />
      <CategoryIconGrid selected={category} onChange={onChangeCategory} />
    </View>
  );
}

interface CollapsibleDetailRowProps {
  selected: string | null;
  options: readonly Option[];
  onChange: (next: string | null) => void;
}

/**
 * 소분류 줄. 대분류를 고르면 **위에서 아래로 펼쳐지고**, 「전체」로 가면 다시 접힌다.
 *
 * ⚠️ 대분류를 A에서 B로 바꿀 때는 **펼친 채로** 안의 알약만 바뀐다. 접었다 펴면
 *    줄 아래 카테고리 격자가 두 번 출렁여 화면이 튄다.
 *    그래서 애니메이션은 `펼침 여부`만 보고, 목록이 바뀌는 것은 못 본 척한다.
 *
 * ⚠️ 접히는 동안에도 알약이 보여야 위로 말려 들어가는 것처럼 읽힌다. 그래서 마지막으로
 *    보여준 목록을 붙잡아 두었다가, 다 접힌 뒤에 비운다.
 */
function CollapsibleDetailRow({ selected, options, onChange }: CollapsibleDetailRowProps) {
  const open = options.length > 0;
  const [shown, setShown] = useState(options);
  const progress = useSharedValue(open ? 1 : 0);

  // 펼쳐질 목록은 바로 갈아 끼운다(A → B는 알약만 바뀐다).
  useEffect(() => {
    if (options.length > 0) setShown(options);
  }, [options]);

  // ⚠️ 여기 의존성에 options가 없다. 목록만 바뀌었을 때 애니메이션이 다시 시작하면 안 된다.
  useEffect(() => {
    progress.value = withTiming(
      open ? 1 : 0,
      { duration: COLLAPSE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        // 다 접힌 뒤에야 알약을 치운다 — 먼저 치우면 빈 칸만 접히는 게 보인다.
        if (finished && !open) runOnJS(setShown)(NO_OPTIONS);
      },
    );
  }, [open, progress]);

  const collapseStyle = useAnimatedStyle(() => ({
    height: DETAIL_ROW_HEIGHT * progress.value,
    opacity: progress.value,
  }));

  return (
    // ⚠️ overflow: 'hidden'이 없으면 접히는 동안 알약이 줄 밖으로 삐져나온다.
    <Animated.View testID="pet-detail-collapse" style={[styles.collapse, collapseStyle]}>
      {shown.length > 0 && (
        <FilterPillRow selected={selected} options={shown} onChange={onChange} />
      )}
    </Animated.View>
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

function Pill({ pillKey, label, active, onPress }: PillProps) {
  return (
    <Pressable
      testID={`pet-detail-pill-${pillKey}`}
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

interface CategoryIconGridProps {
  selected: string | null;
  onChange: (next: string | null) => void;
}

/**
 * 카테고리는 알약이 아니라 「동그란 그림 + 이름」이다 (웹 CategoryFilter.tsx와 같은 모양).
 *
 * ⚠️ **여기엔 「전체」가 없다.** 아무것도 안 고른 상태가 곧 전체이고, 되돌릴 때는
 *    고른 것을 다시 누르면 풀린다. 웹도 그렇다 —
 *    `CategoryFilter.tsx:17-26`이 여덟 개만 그리고 재클릭으로 해제한다.
 *    (앞줄 탭·알약은 글자라 「전체」가 자연스럽지만, 그림 줄에 「전체」 그림을 지어낼 이유는 없다)
 */
function CategoryIconGrid({ selected, onChange }: CategoryIconGridProps) {
  const tile = (option: Option) => (
    <CategoryTile
      key={option.code}
      code={option.code}
      label={option.label}
      icon={CATEGORY_ICONS[option.code]}
      active={option.code === selected}
      onPress={() => onChange(option.code === selected ? null : option.code)}
    />
  );

  // ⚠️ 옆으로 미는 게 아니라 **줄바꿈**이다. 한 줄에 몇 개가 들어갈지는 기기 폭이 정한다
  //    (타일 64 + 사이 12로 채우다가 자리가 없으면 다음 줄로 넘어간다).
  //    좁은 폰에서는 3~4개씩, 넓은 폰에서는 5개씩 놓인다 — 줄 수를 못 박지 않는다.
  return (
    <View testID="category-grid" style={styles.grid}>
      {CATEGORY_OPTIONS.map(tile)}
    </View>
  );
}

interface CategoryTileProps {
  code: string;
  label: string;
  icon: number;
  active: boolean;
  onPress: () => void;
}

function CategoryTile({ code, label, icon, active, onPress }: CategoryTileProps) {
  return (
    <Pressable
      testID={`category-tile-${code}`}
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
  /**
   * 조각을 통째로 덮는 흰 바탕. 앱의 다른 화면·바로 아래 툴바와 같은 흰색이다.
   * 대분류 탭과 소분류·카테고리 줄이 **둘 다** 쓴다 — 둘 다 홈 배경(#F9FAFB) 위에 뜬다.
   */
  sheet: {
    backgroundColor: colors.surface,
  },

  // ── 소분류 알약 줄 ──────────────────────────────────────────────
  collapse: {
    // 접히는 동안 알약이 줄 밖으로 나오지 않게 잘라 낸다.
    overflow: 'hidden',
    // ⚠️ 여기에도 흰 배경이 있어야 한다. 없으면 접히는 동안 이 줄만 회색으로 비친다.
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 32,
  },
  // 대분류 탭보다 한 단계 작다 — 아래 단계이니 눈에도 그렇게 읽혀야 한다.
  // ⚠️ height를 고치면 위 DETAIL_ROW_HEIGHT도 같이 고친다(접히는 줄의 높이다).
  chip: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
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
    fontSize: 13,
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

  // ── 카테고리 그림 격자 ──────────────────────────────────────────
  grid: {
    backgroundColor: colors.surface,
    // ⚠️ 줄 수를 못 박지 않는다. 기기 폭에 맞춰 넘어간다 —
    //    좁은 폰은 3~4개씩, 넓은 폰은 5개씩 한 줄에 놓인다.
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // 안 고른 것도 같은 두께를 미리 잡아 둔다 — 안 그러면 고를 때마다 그림이 그만큼 줄어든다.
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  // 고른 것이 눈에 띄게 — 동그라미에 브라운 테두리를 두르고 이름을 굵게 한다
  tileCircleActive: {
    borderColor: colors.selected,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileLabel: {
    fontSize: 12,
  },
  tileLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  tileLabelIdle: {
    color: colors.onSurfaceMedium,
    fontWeight: '400',
  },
});
