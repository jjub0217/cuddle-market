import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

// 밑줄이 미끄러지는 탭. **홈(상품 대분류)과 커뮤니티(게시판)가 나눠 쓴다.**
//
// 원래 components/products/product-filter-row.tsx 안에만 있던 것을 빼냈다(#944).
// 커뮤니티 게시판도 같은 모양이어야 해서다 — 같은 자리에 있는 같은 성격의 줄이
// 화면마다 다른 모양이면 한 앱으로 안 보인다.
//
// ⚠️ **바는 탭마다 하나씩이 아니라 줄 전체에 하나뿐이다.** 탭마다 자기 borderBottom 을
//    켜고 끄면 즉시 갈아 끼워져 「툭툭 끊긴다」로 느껴진다(2026-08-06 실기기).
//    컬리 앱처럼 바 하나가 옆으로 **미끄러져** 가야 한다. 그래서 탭의 자리(x·너비)를
//    재 두고, 그 자리로 바를 옮긴다.
//
// ⚠️ **표식(testID) 앞머리를 값으로 받는다.** 상품 쪽 시험이 `pet-type-tab-*` 를 그대로
//    쓰기 때문이다 — 여기서 이름을 지어 버리면 그쪽이 한꺼번에 빨개진다.
//    상품 'pet-type-tab' · 커뮤니티 'board-tab'
//
// ⚠️ **「전체」 탭은 `allLabel` 을 줄 때만 생긴다.** 상품에는 있고 커뮤니티에는 없다 —
//    커뮤니티 게시판은 질문이거나 정보 공유거나 둘 중 하나라 「조건 없음」이 없다.

/** 탭 아래 바가 옆 탭으로 미끄러지는 시간. place-sheet(240)와 같은 값이다. */
const TAB_SLIDE_MS = 240;

/** 탭 아래 바의 두께. `styles.tab`이 같은 값으로 자리를 비워 둔다 — 둘을 함께 고쳐야 한다. */
const TAB_BAR_HEIGHT = 3;

/**
 * 「전체」 탭의 열쇠. 밖으로는 **`null` 로 알린다** — 서버에 'ALL' 같은 글자를 보내면
 * 그런 이름의 값을 찾아 아무것도 안 나온다.
 */
const ALL_OPTION_KEY = 'ALL';

/** 고를 것 하나. `@cuddle/shared` 의 `Option` 과 같은 모양이라 그대로 넘길 수 있다. */
export interface UnderlineTabOption {
  code: string;
  label: string;
}

/** 탭 하나가 어디에 얼마만 한 너비로 놓였는지. `onLayout`으로 재서 채운다. */
interface TabLayout {
  x: number;
  width: number;
}

interface Props {
  /** 지금 고른 값. `null` 이면 「전체」다 */
  selected: string | null;
  options: readonly UnderlineTabOption[];
  onChange: (next: string | null) => void;
  /** 맨 앞 「전체」 탭의 글자. **안 주면 「전체」 탭이 없다**(커뮤니티가 그렇다) */
  allLabel?: string;
  /** 표식 앞머리. 상품 'pet-type-tab' · 커뮤니티 'board-tab' */
  testIDPrefix: string;
}

export function UnderlineTabs({ selected, options, onChange, allLabel, testIDPrefix }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  // ⚠️ **탭이 도중에 바뀌는 쓰임이 생기면 여기를 먼저 보라.** 사라진 탭의 자리가 이 표에
  //    그대로 남는다. 지금은 쓰는 두 곳이 다 **고정 목록**(PET_TYPE_OPTIONS · BOARD_TABS)
  //    이라 남아도 아무 일이 없어서 그냥 둔다.
  //    치우려고 `useEffect(() => setLayouts({}), [options])` 를 붙일 때는 조심할 것 —
  //    `options` 배열의 신원이 렌더마다 바뀌면 **자리를 매번 지워 바가 튄다.**
  const [layouts, setLayouts] = useState<Record<string, TabLayout>>({});
  /** 눈에 보이는 줄의 너비. 고른 탭을 가운데로 데려올 때 쓴다. */
  const [viewportWidth, setViewportWidth] = useState(0);

  const activeKey = selected ?? ALL_OPTION_KEY;
  const activeLayout = layouts[activeKey];

  const barX = useSharedValue(0);
  const barWidth = useSharedValue(0);
  /** 처음 한 번은 미끄러지지 않고 제자리에 놓는다 — 화면에 들어오자마자 바가 기어가면 어색하다. */
  const placed = useRef(false);

  const 자리를잰다 = (key: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts((prev) => {
      const before = prev[key];
      // 같은 값이면 그대로 둔다 — 새 객체를 만들면 아래 useEffect가 괜히 다시 돈다.
      if (before && before.x === x && before.width === width) return prev;
      return { ...prev, [key]: { x, width } };
    });
  };

  useEffect(() => {
    if (!activeLayout) return;
    if (!placed.current) {
      placed.current = true;
      barX.value = activeLayout.x;
      barWidth.value = activeLayout.width;
      return;
    }
    // 너비도 함께 움직인다 — 탭마다 글자 길이가 달라 자리만 옮기면 폭이 튄다.
    const 곡선 = { duration: TAB_SLIDE_MS, easing: Easing.out(Easing.cubic) };
    barX.value = withTiming(activeLayout.x, 곡선);
    barWidth.value = withTiming(activeLayout.width, 곡선);
  }, [activeLayout, barX, barWidth]);

  // ⚠️ 「탭이 옆으로 이동되는 느낌」의 절반은 이것이다 — 고른 탭이 화면 밖이면 데려온다.
  //    아니면 오른쪽 끝 탭을 눌렀을 때 바가 안 보이는 데로 가 버린다.
  useEffect(() => {
    if (!activeLayout || viewportWidth === 0) return;
    const 가운데 = activeLayout.x + activeLayout.width / 2 - viewportWidth / 2;
    // 음수로 가면 왼쪽 끝이다. 오른쪽 끝을 넘는 값은 ScrollView가 알아서 잡아 준다.
    scrollRef.current?.scrollTo({ x: Math.max(0, 가운데), animated: true });
  }, [activeLayout, viewportWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value,
    transform: [{ translateX: barX.value }],
  }));

  return (
    // ⚠️ **여백 없는 View 로 한 겹 감싼다. 빼지 마라.**
    //    안 감싸면 안쪽 ScrollView 의 `flexGrow: 1`(RN 기본값 `baseHorizontal`)이 살아나,
    //    세로로 세운 화면에서 이 줄이 목록과 남은 자리를 나눠 갖는다.
    //    그러면 **글자 아래가 잘린다** — 커뮤니티에 붙이자마자 실기기에서 그랬다(#944 과제 2).
    //    View 는 기본이 `flexGrow: 0` 이라 내용만큼만 차지한다.
    //
    //    ⚠️ 이 겹을 **쓰는 쪽에 맡기지 않는 이유**: 홈에서 이미 한 번 겪고 주석까지
    //       남겼는데도 커뮤니티에서 또 밟았다. 기억해야 하는 규칙은 또 밟힌다.
    <View>
      <ScrollView
        ref={scrollRef}
        testID={`${testIDPrefix}-row`}
        horizontal
        showsHorizontalScrollIndicator={false}
        // 경계선은 contentContainerStyle이 아니라 style에 준다 — 내용이 짧아도 화면 끝까지 그어져야 한다.
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRowPadding}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      >
        {/*
          ⚠️ 여백 없는 안쪽 상자로 한 겹 더 감싼다. 바는 여기에 절대 자리로 놓이고, 탭의 x도
             여기를 기준으로 재진다 — 둘의 기준점이 같아야 바가 탭에 정확히 붙는다.
             (여백을 이 상자에 주면 「절대 자리 0」이 어디냐가 여백만큼 어긋난다)
        */}
        <View style={styles.tabRow}>
          {allLabel ? (
            <Tab
              tabKey={ALL_OPTION_KEY}
              label={allLabel}
              active={selected === null}
              onPress={() => onChange(null)}
              onLayout={자리를잰다(ALL_OPTION_KEY)}
              testIDPrefix={testIDPrefix}
            />
          ) : null}
          {options.map((option) => (
            <Tab
              key={option.code}
              tabKey={option.code}
              label={option.label}
              active={option.code === selected}
              // ⚠️ 알약과 달리 다시 눌러도 안 푼다. 되돌릴 자리(「전체」 탭)가 맨 앞에 있다.
              onPress={() => onChange(option.code)}
              onLayout={자리를잰다(option.code)}
              testIDPrefix={testIDPrefix}
            />
          ))}
          {/* 줄에 하나뿐인 바. 재기 전에는 너비가 0이라 안 보인다. */}
          <Animated.View testID={`${testIDPrefix}-bar`} style={[styles.tabBar, barStyle]} />
        </View>
      </ScrollView>
    </View>
  );
}

interface TabProps {
  tabKey: string;
  label: string;
  active: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  testIDPrefix: string;
}

function Tab({ tabKey, label, active, onPress, onLayout, testIDPrefix }: TabProps) {
  return (
    <Pressable
      // 시험에서 글자 대신 이 표식으로 누른다 — 글자를 누르면 누름이 단추까지 안 올라갈 때가 있다.
      testID={`${testIDPrefix}-${tabKey}`}
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      // ⚠️ 바가 하나로 바뀌어도 이건 탭마다 남겨 둔다 — 읽어 주는 기능과 시험이 여기를 본다.
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
    >
      <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabScroll: {
    backgroundColor: colors.surface,
    // 탭 줄임을 보이는 옅은 밑줄. 고른 탭의 바(#825500)는 이 위에 겹쳐 그어진다.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  /** 바깥 여백은 여기에만 준다 — 안쪽 상자를 여백 없이 두어야 바의 기준점이 탭과 같아진다. */
  tabRowPadding: {
    paddingHorizontal: 16,
    // 오른쪽 끝 여백. 딱 맞게 끝나면 뒤에 탭이 더 있는 걸 모른다 — 잘린 게 보여야 한다
    paddingRight: 32,
  },
  tabRow: {
    flexDirection: 'row',
    // 바가 이 상자를 기준으로 절대 자리에 놓인다.
    position: 'relative',
  },
  tab: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    // 바가 앉을 자리를 모든 탭이 똑같이 비워 둔다. 안 비우면 바가 글자를 덮는다.
    marginBottom: TAB_BAR_HEIGHT,
  },
  /** 줄에 하나뿐인 바. 재기 전에는 너비 0이라 안 보인다. */
  tabBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: TAB_BAR_HEIGHT,
    // 글자(accent)와 같은 색으로 둔다 — 얇은 선이라 연한 색이면 안 보인다
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: 15,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  tabLabelIdle: {
    color: colors.onSurfaceMedium,
    fontWeight: '400',
  },
  pressed: {
    opacity: 0.7,
  },
});
