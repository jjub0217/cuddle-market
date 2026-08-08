import { useEffect, useRef, useState } from 'react';

import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRODUCT_STATUS_OPTIONS } from '@cuddle/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { colors } from '@/constants/colors';

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
//
// ⚠️ **시트 안에 스크롤이 없다.** 예전에는 시/도 17개와 시/군/구 최대 30개를 한꺼번에
//    펼쳐 놓아 안쪽이 굴러갔는데, 그 스크롤과 겨루느라 쓸어 닫기가 손을 떼야 반응했다.
//    지역을 2단계(시/도 → 시/군/구)로 갈라 한 번에 한 목록만 보이게 하니 스크롤이
//    필요 없어졌고, 껍데기의 조율 장치도 통째로 걷어냈다(#855 후속).
//
//    ⚠️ 그래서 **내용이 시트 최대 높이를 넘으면 그냥 잘린다.** [초기화][적용] 줄은 안
//       줄어들게(flexShrink 0) 두고, 줄어도 되는 본문만 줄어들게 짜 두었다 — 아래 styles.body.

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

/** 시험이 「시/도 목록으로 되돌아가기」를 집을 때 쓰는 이름. 글자보다 이게 안전하다. */
export const REGION_BACK_TEST_ID = 'detail-filter-region-back';

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

  /**
   * 「지금 시/도 목록을 보고 있다」는 표시. 되돌아가기를 눌렀을 때만 켜진다.
   *
   * ⚠️ **고른 시/도와 따로 논다.** 되돌아가도 고른 시/도는 그대로 남아야 해서다
   *    (되돌아간 화면에서 서울이 골라진 채로 보인다). 그래서 「무엇을 골랐나」(draft.sido)와
   *    「어느 목록을 보고 있나」를 한 값으로 겸하지 못한다.
   */
  const [showProvinces, setShowProvinces] = useState(false);

  // 열릴 때마다 밖의 값으로 되돌린다. value 를 의존성에 넣으면 부모가 다시 그릴 때마다
  // (객체가 새로 만들어져서) 고르던 게 지워지므로, 최신 값은 ref 로 들여다본다.
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    if (visible) {
      setDraft(valueRef.current);
      // 이미 시/도가 골라진 채로 열리면 곧바로 시/군/구 단계로 연다 — 사용자가 이어서
      // 좁히려는 것이지, 시/도부터 다시 고르려는 게 아니다.
      setShowProvinces(false);
    }
  }, [visible]);

  const guguns: readonly string[] = draft.sido
    ? ((CITIES as Record<string, readonly string[]>)[draft.sido] ?? [])
    : [];

  /** 지금 지역 자리에 무엇을 펼칠지. 시/도를 골랐고 되돌아가지 않았으면 시/군/구다. */
  const 지역단계: 'sido' | 'gugun' = draft.sido && !showProvinces ? 'gugun' : 'sido';

  const pickStatus = (code: string) => {
    setDraft((prev) => ({ ...prev, productStatus: prev.productStatus === code ? null : code }));
  };

  const pickPrice = (range: { min: number; max: number | null }) => {
    setDraft((prev) => {
      const same = prev.price?.min === range.min && prev.price?.max === range.max;
      return { ...prev, price: same ? null : { min: range.min, max: range.max } };
    });
  };

  /** 시/도 알약. 이건 시/도 단계에서만 눌린다 — 시/군/구 단계에는 시/도 알약이 없다. */
  const pickSido = (sido: string) => {
    // 고르면 시/군/구 단계로 넘어간다. 같은 것을 다시 눌러 푼 경우에는 시/도가 null 이
    // 되므로 어차피 시/도 단계에 머무른다.
    setShowProvinces(false);
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

  /**
   * 「초기화」 — 시트가 담은 셋(상태·가격·지역)을 지우고 **곧바로 반영한다.**
   *
   * ⚠️ 다른 것과 달리 「적용」을 기다리지 않는다. 조금씩 고르는 것과 성격이 다르기 때문이다 —
   *    「다 지우고 처음으로」는 그 자체로 끝난 행동이라, 누른 뒤에 「이제 적용을 누르세요」가
   *    한 번 더 필요하면 어색하다. 실제로 실기기에서 「초기화를 눌렀는데 목록이 그대로다」로
   *    걸렸다(2026-08-06). 웹도 「필터 초기화」는 누르는 즉시 반영한다
   *    (DetailFilterButton.tsx 의 filterReset — 웹에는 「적용」 자체가 없다).
   *
   * 지우는 범위는 **이 시트가 담은 것까지**다. 대분류·카테고리·정렬은 시트 밖에 있으니
   * 건드리지 않는다.
   */
  const resetAll = () => {
    setDraft(EMPTY_DETAIL_FILTER);
    setShowProvinces(false);
    onApply(EMPTY_DETAIL_FILTER);
  };

  return (
    // dragToClose: 손잡이를 껍데기가 그리고, **시트 아무 데나** 아래로 쓸면 닫힌다.
    <BottomSheet visible={visible} onClose={onClose} dragToClose>
      {/* 굴러가지 않는 본문. 자리가 모자라면 여기가 줄고(잘리고), 아래 단추 줄은 안 준다. */}
      <View style={styles.body}>
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

        {/*
          지역은 **한 번에 한 목록만** 펼친다. 시/도를 고르면 시/도 목록이 사라지고
          그 자리에 시/군/구가 온다 — 둘을 함께 펼치면 시트가 화면을 넘긴다.
        */}
        <Section
          title="지역"
          // 시/군/구 단계에서만 제목 옆에 「‹ 서울특별시」가 붙는다.
          right={
            // draft.sido 를 다시 보는 것은 타입을 좁히려는 것이다 — 지역단계가 'gugun'
            // 이면 시/도가 반드시 있지만, 타입스크립트는 거기까지 못 따라온다.
            지역단계 === 'gugun' && draft.sido ? (
              <RegionBack sido={draft.sido} onPress={() => setShowProvinces(true)} />
            ) : null
          }
        >
          {지역단계 === 'gugun'
            ? guguns.map((gugun) => (
                <Pill
                  key={gugun}
                  label={gugun}
                  active={draft.gugun === gugun}
                  onPress={() => pickGugun(gugun)}
                />
              ))
            : PROVINCES.map((province) => (
                <Pill
                  key={province}
                  label={province}
                  // ⚠️ 되돌아와도 고른 시/도는 골라진 채로 보인다. 다시 누르면 풀린다.
                  active={draft.sido === province}
                  onPress={() => pickSido(province)}
                />
              ))}
        </Section>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={resetAll}
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
  /** 제목 옆에 붙는 것. 지역의 「‹ 서울특별시」가 여기 온다 */
  right?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, right, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {right}
      </View>
      <View style={styles.pillGroup}>{children}</View>
    </View>
  );
}

interface RegionBackProps {
  sido: string;
  onPress: () => void;
}

/**
 * 시/군/구를 보다가 시/도 목록으로 되돌아가는 표시. 「‹ 서울특별시」로 보인다.
 *
 * ⚠️ **문구도 모양도 새로 짓지 않았다.**
 *    - 읽어 주는 이름 `뒤로` 와 왼쪽 홑화살표(lucide `ChevronLeft`)는 앱의 모든 화면
 *      헤더가 쓰는 것이다(ui/screen-header.tsx).
 *    - 다만 크기·색은 헤더 것(26 · #111827)이 아니라 **줄 안에 들어가는 화살표**의 값
 *      (18 · #6B7280)을 쓴다 — 지역 고르기 칸(products/region-field.tsx)의 `ChevronDown`
 *      과 같다. 제목 글자가 13이라 26짜리를 넣으면 화살표가 제목보다 커진다.
 *    - 옆 글자는 지금 고른 시/도 이름 그대로다.
 *
 * ⚠️ 되돌아가도 **고른 시/도는 안 푼다.** 푸는 것은 되돌아간 화면에서 그 시/도를 다시
 *    눌렀을 때다(pickSido).
 */
function RegionBack({ sido, onPress }: RegionBackProps) {
  return (
    <Pressable
      testID={REGION_BACK_TEST_ID}
      onPress={onPress}
      accessibilityRole="button"
      // 헤더의 뒤로 단추와 같은 이름이다(ui/screen-header.tsx)
      accessibilityLabel="뒤로"
      // 글자가 작아 누르는 자리가 좁다. 헤더의 뒤로 단추와 같은 12를 준다
      hitSlop={12}
      style={({ pressed }) => [styles.regionBack, pressed && styles.pressed]}
    >
      <ChevronLeft size={18} color={colors.onSurfaceMuted} strokeWidth={2} />
      <Text style={styles.regionBackLabel}>{sido}</Text>
    </Pressable>
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
  // 이 본문이 flexShrink 로 **남는 자리를 다 차지한 뒤 필요한 만큼만 줄어든다.**
  // 아래 단추 줄은 flexShrink 가 0(리액트 네이티브 기본값)이라 줄지 않고 늘 보인다.
  //
  // ⚠️ **overflow: 'hidden' 이 [초기화][적용] 을 지킨다.** 스크롤이 없어졌으니 아주 좁은
  //    화면에서는 알약이 이 자리를 넘칠 수 있는데, 안 잘라 내면 iOS 에서는 넘친 알약이
  //    단추 줄 **위에 겹쳐 그려진다**(RN 기본 overflow 가 'visible' 이다). 잘라 내면
  //    아래쪽 알약 몇 개가 안 보일 뿐, 단추는 늘 온전히 남는다.
  body: {
    flexShrink: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  section: { gap: 8 },
  // 제목과 「‹ 시/도」가 한 줄에 선다. 되돌아가기가 없을 때는 제목만 있는 줄이다
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  regionBack: {
    flexDirection: 'row',
    alignItems: 'center',
    // 화살표와 글자 사이. 붙여야 「이 이름으로 되돌아간다」 한 덩어리로 읽힌다
    gap: 2,
  },
  regionBackLabel: {
    fontSize: 13,
    fontWeight: '600',
    // 화살표와 같은 회색. 제목(#111827)보다 옅어야 제목을 안 밀어낸다
    color: colors.onSurfaceMuted,
  },
  // ⚠️ 줄바꿈. 시/군/구가 최대 30개(경기도)라 한 줄로는 못 쓴다
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // ⚠️ 앞줄 알약(product-filter-row.tsx 의 chip)과 **같은 값**이다 — 높이 30 · 좌우 12 ·
  //    글자 13. 예전에는 여기만 34/16/14 로 컸는데, 스크롤을 걷어내면서 한 화면에
  //    담아야 해서 앞줄에 맞춰 줄였다. 덤으로 두 곳이 같은 크기로 보인다.
  //    (경기도 30개 기준 높이 계산이 이 값에 걸려 있다. 키우려면 다시 재 볼 것)
  chip: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: colors.selectedSurface,
    borderColor: colors.selected,
  },
  chipIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.outlineBrand,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
  },
  labelActive: { color: colors.accent },
  labelIdle: { color: colors.onSurfaceMedium },
  pressed: { opacity: 0.7 },

  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceSunken,
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
    borderColor: colors.outlineBrand,
    backgroundColor: colors.surface,
  },
  applyButton: {
    flex: 2,
    backgroundColor: colors.action,
  },
  resetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurfaceMedium,
  },
  applyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onAction,
  },
});
