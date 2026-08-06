import { useEffect, useRef, useState } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PRODUCT_STATUS_OPTIONS } from '@cuddle/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';

import { CITIES, PROVINCES } from '@/constants/cities';

// 상품 목록의 「세부 필터」 — 아래에서 올라오는 시트에 상품 상태 · 가격대 · 지역을 담는다.
//
// 앞줄 알약(product-filter-row.tsx)은 누르는 즉시 목록이 바뀌지만, 여기는 다르다.
// 셋을 모아 고른 뒤 「적용」을 눌러야 알린다 — 고를 때마다 가려진 목록이 다시 그려지면
// 어수선하기 때문이다(설계 §4). 그래서 시트 안에는 「고르는 중인 값」을 따로 들고 있다가
// 「적용」에서만 밖으로 넘긴다. 그냥 닫으면 고르던 것을 버리고 열 때 값으로 되돌아간다.
//
// 껍데기는 이미 있는 components/ui/bottom-sheet.tsx 를 쓴다(상품 ⋮ 메뉴 · 가입 거주지와 같은 것).
// ⚠️ 기기 아래쪽 안전영역(insets.bottom)은 그 껍데기가 「재는 상자」에 이미 더해 준다(#843).
//    여기서 또 더하면 두 번 세게 되니 더하지 않는다.

/** 가격 구간. 웹 src/constants/constants.ts 의 PRICE_TYPE 을 그대로 옮긴 것 —
 *  웹에서 바뀌면 여기도 같이 바꾼다. 문구를 새로 짓지 않는다. */
const PRICE_RANGES = [
  { value: { min: 0, max: 10000 }, title: '1만원 이하' },
  { value: { min: 10000, max: 50000 }, title: '1만원~5만원' },
  { value: { min: 50000, max: 100000 }, title: '5만원~10만원' },
  // ⚠️ 위 끝이 없는 구간은 max 가 null 이다. 서버로 보낼 때 maxPrice 를 안 싣는 근거가 된다.
  { value: { min: 100000, max: null }, title: '10만원 이상' },
] as const;

/** 시트가 고르는 값. 안 고른 건 null 이다.
 *  ⚠️ 목록 전체가 쓰는 ProductFilters 와는 별개다 — 이 시트는 자기가 담는 넷만 안다. */
export interface DetailFilterValue {
  productStatus: string | null;
  price: { min: number; max: number | null } | null;
  sido: string | null;
  gugun: string | null;
}

export const EMPTY_DETAIL_FILTER: DetailFilterValue = {
  productStatus: null,
  price: null,
  sido: null,
  gugun: null,
};

interface Props {
  visible: boolean;
  /** 시트를 열 때의 값. 열릴 때마다 이걸로 되돌린다 */
  value: DetailFilterValue;
  /** 바깥을 눌러 닫았을 때. 고르던 것은 버려진다 — 알리지 않는다 */
  onClose: () => void;
  /** 「적용」을 눌렀을 때만 부른다. 시트를 닫는 것은 이걸 받은 쪽이 한다 */
  onApply: (next: DetailFilterValue) => void;
}

export function DetailFilterSheet({ visible, value, onClose, onApply }: Props) {
  // 「고르는 중인 값」. 적용 전까지는 밖으로 안 나간다.
  const [draft, setDraft] = useState<DetailFilterValue>(value);

  // 열릴 때마다 밖의 값으로 되돌린다. value 를 의존성에 넣으면 부모가 다시 그릴 때마다
  // (객체가 새로 만들어져서) 고르던 게 지워지므로, 최신 값은 ref 로 들여다본다.
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    if (visible) setDraft(valueRef.current);
  }, [visible]);

  const guguns: readonly string[] = draft.sido
    ? ((CITIES as Record<string, readonly string[]>)[draft.sido] ?? [])
    : [];

  const pickStatus = (code: string) => {
    setDraft((prev) => ({ ...prev, productStatus: prev.productStatus === code ? null : code }));
  };

  const pickPrice = (range: { min: number; max: number | null }) => {
    setDraft((prev) => {
      const same = prev.price?.min === range.min && prev.price?.max === range.max;
      return { ...prev, price: same ? null : { min: range.min, max: range.max } };
    });
  };

  const pickSido = (sido: string) => {
    setDraft((prev) => {
      const same = prev.sido === sido;
      // ⚠️ 시/도를 바꾸면 고른 시/군/구를 푼다 — 서울 강남구에서 부산으로 바꾸면
      //    강남구가 남으면 안 된다(대분류→소분류와 같은 규칙).
      return { ...prev, sido: same ? null : sido, gugun: null };
    });
  };

  const pickGugun = (gugun: string) => {
    setDraft((prev) => ({ ...prev, gugun: prev.gugun === gugun ? null : gugun }));
  };

  return (
    // dragToClose: 손잡이를 껍데기가 그리고, 그 손잡이를 아래로 끌면 닫힌다.
    // 왜 손잡이에서만 끄는지는 bottom-sheet.tsx 의 dragToClose 설명에 적어 두었다 —
    // 안이 스크롤되는 시트라, 내용 위에서도 끌리게 하면 굴리기와 부딪힌다.
    <BottomSheet visible={visible} onClose={onClose} dragToClose>
      {/* 지역까지 다 펼치면 화면을 넘어서므로 안쪽만 스크롤한다. 단추 두 개는 늘 보여야 한다 */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Section title="상품 상태">
          {PRODUCT_STATUS_OPTIONS.map((option) => (
            <Pill
              key={option.code}
              label={option.label}
              active={draft.productStatus === option.code}
              onPress={() => pickStatus(option.code)}
            />
          ))}
        </Section>

        <Section title="가격대">
          {PRICE_RANGES.map((range) => (
            <Pill
              key={range.title}
              label={range.title}
              active={draft.price?.min === range.value.min && draft.price?.max === range.value.max}
              onPress={() => pickPrice(range.value)}
            />
          ))}
        </Section>

        <Section title="지역">
          {PROVINCES.map((province) => (
            <Pill
              key={province}
              label={province}
              active={draft.sido === province}
              onPress={() => pickSido(province)}
            />
          ))}
        </Section>

        {/* 시/도를 골라야 나타난다. 시/군/구는 최대 30개(경기도)라 줄바꿈으로 펼친다 */}
        {draft.sido ? (
          <View style={styles.gugunGroup}>
            {guguns.map((gugun) => (
              <Pill
                key={gugun}
                label={gugun}
                active={draft.gugun === gugun}
                onPress={() => pickGugun(gugun)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setDraft(EMPTY_DETAIL_FILTER)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.resetButton, pressed && styles.pressed]}
        >
          <Text style={styles.resetLabel}>초기화</Text>
        </Pressable>
        <Pressable
          onPress={() => onApply(draft)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.applyButton, pressed && styles.pressed]}
        >
          <Text style={styles.applyLabel}>적용</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.pillGroup}>{children}</View>
    </View>
  );
}

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/** 앞줄 알약(product-filter-row.tsx)과 같은 모양 — 두 곳이 따로 놀면 같은 앱으로 안 보인다.
 *  다만 여기는 가로 스크롤이 아니라 줄바꿈이라 알약 스스로 줄을 넘긴다. */
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
  // ⚠️ 높이를 못 박지 않는다.
  //
  // 예전에는 maxHeight: 420 이었다. 그래서 시트 아래쪽(손잡이·단추 줄 사이의 빈 자리)을
  // 잡으면 아무 일도 안 났고, 사용자에게는 「올라가는 자리가 따로 있는」 것으로 보였다(#855).
  //
  // 지금은 껍데기가 시트 전체 높이를 화면의 85%로 끊어 주고(bottom-sheet.tsx),
  // 이 스크롤 영역이 flexShrink 로 **남는 자리를 다 차지한 뒤 필요한 만큼만 줄어든다.**
  // 아래 단추 줄은 flexShrink 가 0(리액트 네이티브 기본값)이라 줄지 않고 늘 보인다.
  body: { flexShrink: 1 },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  // ⚠️ 줄바꿈. 시/군/구가 최대 30개라 한 줄로는 못 쓴다
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // 고른 시/도 바로 아래에 붙여 「이 시/도의 것」임이 보이게 한다
  gugunGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
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
  labelActive: { color: '#FFFFFF' },
  labelIdle: { color: '#4B5563' },
  pressed: { opacity: 0.7 },

  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 초기화는 덜 눈에 띄게, 적용이 주인공이다
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4C4B2',
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#825500',
  },
  resetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
