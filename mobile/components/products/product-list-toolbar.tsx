import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';

import { BottomSheet, sheetItemStyles } from '@/components/ui/bottom-sheet';

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
}

export function ProductListToolbar({
  productType,
  sortBy,
  onChangeProductType,
  onChangeSort,
  onPressFilter,
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
            <Pressable
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
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.right}>
        <Pressable
          testID="open-detail-filter"
          onPress={onPressFilter}
          accessibilityRole="button"
          accessibilityLabel="세부 필터"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <SlidersHorizontal size={18} color="#4B5563" strokeWidth={2} />
        </Pressable>

        <Pressable
          testID="open-sort"
          onPress={() => setSortOpen(true)}
          accessibilityRole="button"
          // 지금 고른 것이 소리로도 읽히게 이름에 같이 넣는다
          accessibilityLabel={`정렬 ${selectedSort.label}`}
          style={({ pressed }) => [styles.sortTrigger, pressed && styles.pressed]}
        >
          {/* 지금 고른 정렬은 늘 눈에 보여야 한다 — 열어 보지 않고도 알 수 있게 */}
          <Text style={styles.sortLabel}>{selectedSort.label}</Text>
          <ChevronDown size={16} color="#4B5563" strokeWidth={2} />
        </Pressable>
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
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    // 아래 목록과 붙어 보이지 않게 선을 하나 긋는다. 웹도 이 줄 아래에 border-b가 있다.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  // 알약 색은 위쪽 필터 줄(product-filter-row.tsx)과 **같은 값**이다.
  // 두 줄이 붙어 있는데 색이 다르면 다른 앱처럼 보인다.
  pill: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillActive: {
    backgroundColor: '#825500',
    borderColor: '#825500',
  },
  pillIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4C4B2',
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  pillLabelActive: { color: '#FFFFFF' },
  pillLabelIdle: { color: '#4B5563' },

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
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    paddingLeft: 4,
  },
  sortLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  sheetLabelActive: {
    color: '#825500',
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
});
