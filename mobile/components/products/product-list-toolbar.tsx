import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable as GesturePressable } from 'react-native-gesture-handler';

import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';

import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';
import { colors } from '@/constants/colors';

// ⚠️ **이 줄의 단추는 gesture-handler 누름판을 쓴다. RN 것으로 되돌리지 마라**(#935).
//
// 이 줄은 목록에 **붙는다**(product-list-view.tsx 의 renderSectionHeader).
// 붙는 줄은 원래 자리를 위에 그대로 둔 채 화면에 보이게 아래로 밀어서 그리는데,
// RN 의 누름판은 손을 뗄 때 「아직 단추 안인가」를 **원래 자리**로 재고 손가락은
// **보이는 자리**에 있다. 그래서 「밖으로 나갔다」로 보고 onPress 를 버린다.
//
//   onPressIn (누를 때)   뜬다      → 눌린 표시는 잠깐 보인다
//   onPress   (뗄 때)     버려진다   → 「아무 일도 안 일어난다」
//
// 리액트 네이티브 0.79.2 부터 생긴 회귀다(facebook/react-native#51763).
// 고치는 PR(#57052)은 아직 안 머지됐고, 앱은 Expo SDK 54라 RN 0.81.5 에 묶여 있어
// 올려서 피할 수도 없다. gesture-handler 는 네이티브 제스처로 판정해서 이 재기를 안 한다.
//
// ⚠️ **시트 안(정렬 목록)은 RN 누름판 그대로 둔다.** 시트는 Modal 인데, 안드로이드에서
//    Modal 안은 별도 창이라 앱 바깥의 GestureHandlerRootView 가 안 닿는다. 정렬 시트는
//    끌어 닫기를 안 써서 그 안에 GestureHandlerRootView 도 없다 —
//    거기까지 바꾸면 **오류 없이 조용히 안 눌린다**(bottom-sheet.tsx 맨 위 설명).
//    그리고 시트는 붙는 줄이 아니라 애초에 이 고장과 무관하다.
//
// ⚠️ **jest 로는 못 잡는다.** 자리가 어긋나는 것은 진짜 화면에서만 생긴다.

// 상품 목록 **바로 위에 고정되는** 줄.
//
//   [전체][판매][판매요청]              [⚙] 최신순 ▾
//
// 위쪽 필터 알약 두 줄(product-filter-row.tsx)은 스크롤되어 사라지지만 이 줄은 남는다.
// 종류를 바꾸거나 정렬을 바꾸는 건 목록을 보는 도중에 가장 자주 하는 일이라서다.
//
// ⚠️ 상품 개수는 안 넣는다 — 웹에도 없다(설계 §2).

/**
 * 왼쪽 알약 값. 웹 `src/constants/constants.ts`의 `PRODUCT_TYPE_TABS`를 **그대로** 옮겼다.
 *
 * 왜 옮겨 적나: 웹의 `src/`는 앱에서 import 할 수 없고, 두 쪽이 함께 쓰는
 * `@cuddle/shared`에도 이 값은 아직 없다. 문구를 새로 짓지 않으려고 표를 그대로 둔다 —
 * 웹에서 이 표가 바뀌면 여기도 같이 고친다.
 */
export const PRODUCT_TYPE_TABS = [
  { id: 'tab-all', label: '전체', code: 'ALL' },
  { id: 'tab-sales', label: '판매', code: 'SELL' },
  { id: 'tab-purchases', label: '판매요청', code: 'REQUEST' },
] as const;

/** 오른쪽 정렬 값. 웹 `SORT_TYPE`을 그대로 옮겼다(위와 같은 이유). */
export const SORT_TYPE = [
  { id: 'createdAt', label: '최신순' },
  { id: 'orderedLowPriced', label: '저가순' },
  { id: 'orderedHighPriced', label: '고가순' },
  { id: 'favoriteCount', label: '찜 많은 순' },
] as const;

/**
 * 「전체」를 나타내는 웹 쪽 코드. 이 줄 밖으로는 **`null`로 알린다** —
 * 서버에 `productType=ALL`을 보내면 그런 이름의 종류를 찾아 아무것도 안 나온다
 * (「전체는 빈 값」 규칙, 계획서 Task 1).
 */
const ALL_CODE = 'ALL';

interface Props {
  /** 지금 고른 상품 종류. 「전체」는 `null`이다 */
  productType: string | null;
  /** 지금 고른 정렬. 웹 `SORT_TYPE`의 id — 기본은 `'createdAt'`(최신순) */
  sortBy: string;
  onChangeProductType: (next: string | null) => void;
  onChangeSort: (next: string) => void;
  /** `⚙`를 눌렀다고 알리기만 한다. 세부 필터 시트는 쓰는 쪽이 연다 */
  onPressFilter: () => void;
  /**
   * 세부 필터(상태·가격·지역)가 하나라도 걸려 있는가.
   *
   * ⚠️ 걸려 있으면 `⚙`에 **점**을 찍는다. 세부 필터는 시트 안으로 숨어서,
   *    열어 보기 전에는 걸렸는지 알 수 없기 때문이다(#970).
   *    웹 모바일도 같은 자리에 같은 점을 찍는다 — 두 쪽이 달라 보이면 안 된다.
   */
  hasDetailFilter?: boolean;
}

export function ProductListToolbar({
  productType,
  sortBy,
  onChangeProductType,
  onChangeSort,
  onPressFilter,
  hasDetailFilter = false,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);

  // 화면에는 id가 아니라 한글을 보여준다. 모르는 id면 첫 값(최신순)으로 둔다.
  const selectedSort = SORT_TYPE.find((sort) => sort.id === sortBy) ?? SORT_TYPE[0];

  const pickSort = (id: string) => {
    onChangeSort(id);
    setSortOpen(false);
  };

  return (
    <View style={styles.bar}>
      {/* 알약이 셋뿐이라 대개 다 들어가지만, 글자 크기를 키운 기기에서는 넘칠 수 있어
          가로로 밀 수 있게 둔다. 오른쪽 단추 자리는 flexShrink로 지킨다. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {PRODUCT_TYPE_TABS.map((tab) => {
          const code = tab.code === ALL_CODE ? null : tab.code;
          const active = productType === code;
          return (
            <GesturePressable
              key={tab.id}
              testID={`product-type-${tab.code}`}
              onPress={() => onChangeProductType(code)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.pill,
                active ? styles.pillActive : styles.pillIdle,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.pillLabel, active ? styles.pillLabelActive : styles.pillLabelIdle]}>
                {tab.label}
              </Text>
            </GesturePressable>
          );
        })}
      </ScrollView>

      <View style={styles.right}>
        <GesturePressable
          testID="open-detail-filter"
          onPress={onPressFilter}
          accessibilityRole="button"
          accessibilityLabel={hasDetailFilter ? '세부 필터, 적용됨' : '세부 필터'}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <SlidersHorizontal size={18} color={colors.onSurfaceMedium} strokeWidth={2} />
          {/* 걸려 있음을 알리는 점. 아이콘 오른쪽 위에 붙는다 */}
          {hasDetailFilter ? <View style={styles.filterDot} /> : null}
        </GesturePressable>

        <GesturePressable
          testID="open-sort"
          onPress={() => setSortOpen(true)}
          accessibilityRole="button"
          // 지금 고른 것이 소리로도 읽히게 이름에 같이 넣는다
          accessibilityLabel={`정렬 ${selectedSort.label}`}
          style={({ pressed }) => [styles.sortTrigger, pressed && styles.pressed]}
        >
          {/* 지금 고른 정렬은 늘 눈에 보여야 한다 — 열어 보지 않고도 알 수 있게 */}
          <Text style={styles.sortLabel}>{selectedSort.label}</Text>
          <ChevronDown size={16} color={colors.onSurfaceMedium} strokeWidth={2} />
        </GesturePressable>
      </View>

      {/* 고르는 목록은 앱의 다른 시트(고르는 칸·마이페이지)와 같은 껍데기를 쓴다 */}
      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)}>
        <ScrollView>
          {SORT_TYPE.map((sort, index) => {
            const active = sort.id === selectedSort.id;
            return (
              <Pressable
                key={sort.id}
                testID={`sort-${sort.id}`}
                onPress={() => pickSort(sort.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  sheetItemStyles.item,
                  index > 0 && sheetItemStyles.itemDivider,
                  pressed && sheetItemStyles.itemPressed,
                ]}
              >
                <Text style={[sheetItemStyles.label, active && styles.sheetLabelActive]}>
                  {sort.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    // 알약 줄이 자기 위아래 여백(tabs.paddingVertical)을 갖고 있어 여기서는 적게 준다.
    // 둘을 더한 값이 줄 높이다 — 여기만 키우면 알약은 여전히 잘린다.
    paddingVertical: 3,
    backgroundColor: colors.surface,
    // 아래 목록과 붙어 보이지 않게 선을 하나 긋는다. 웹도 이 줄 아래에 border-b가 있다.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
    // ⚠️ **이 여백이 없으면 알약 아래쪽이 깎인다.** 가로로 미는 상자는 넘치는 것을 잘라내는데,
    //    알약 높이(30)와 상자 높이가 똑같아 테두리·둥근 모서리가 경계에 닿는다
    //    (2026-08-06 실기기). 위쪽 소분류 알약 줄은 같은 자리에 8이 있어서 안 잘렸다.
    paddingVertical: 4,
  },
  // 알약 색은 위쪽 필터 줄(product-filter-row.tsx)과 **같은 값**이다.
  // 두 줄이 붙어 있는데 색이 다르면 다른 앱처럼 보인다.
  pill: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  pillIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  pillLabelActive: { color: colors.onSelected, fontWeight: '600' },
  pillLabelIdle: { color: colors.onSurfaceMedium },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // 알약 줄이 길어져도 오른쪽 단추가 밀려 잘리지 않게 한다
    flexShrink: 0,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 점은 아이콘(18)의 오른쪽 위 모서리에 걸친다. 단추(32) 기준이 아니라
  // **아이콘 기준**이라야 웹과 같은 자리에 보인다.
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.selected,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    paddingLeft: 4,
  },
  sortLabel: {
    fontSize: 13,
    color: colors.onSurfaceMedium,
  },
  sheetLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
});
