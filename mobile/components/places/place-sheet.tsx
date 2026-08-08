import { forwardRef, useCallback, useImperativeHandle, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PlaceListItem } from '@/components/places/place-list-item';
import { colors } from '@/constants/colors';
import type { PlaceListItem as PlaceListItemType } from '@/lib/places/types';

// 지도 위에 떠 있는 목록. 손가락으로 끌어올린다.
//
// ⚠️ components/ui/bottom-sheet.tsx 를 쓰지 않는다. 그건 Modal 로 화면을 덮는 조각이라
//    지도 위에 **계속 떠 있어야** 하는 여기에는 못 쓴다. 이름만 비슷하고 하는 일이 다르다.
//
// ⚠️ 이게 앱에서 제스처를 쓰는 첫 자리다. app/_layout.tsx 를 GestureHandlerRootView 로
//    감싸 두었다 — 없으면 안드로이드에서 **조용히 아무 반응이 없다**.

// ⚠️⚠️ **높이를 애니메이션하지 않는다. 위아래로 옮긴다.**
//
// 처음엔 height 를 직접 움직였다. 실기기에서 이렇게 됐다(2026-08-06):
//   끌어도 화면이 안 따라옴 → 탭을 나갔다 오니 그제야 올라가 있음 → 내릴 때 덜커덕거림
//
// 높이가 바뀌면 **매 프레임 배치를 다시 계산**해야 한다. 안드로이드에서 그 계산이
// 프레임을 못 따라가면 값만 바뀌고 화면은 다시 그릴 때까지 안 움직인다.
//
// 그래서 시트는 **펼친 높이로 못 박아 두고**, 접힘은 아래로 밀어 둔 상태로 만든다.

/**
 * 접었을 때 보이는 높이. **손잡이 + 알약 줄이 들어가야 한다.**
 * 네이버 지도 앱도 시트를 내려도 필터 알약은 계속 보인다(설계 §5-1).
 * 알약이 안 보이면 종류를 바꾸려고 매번 시트를 올려야 한다.
 */
const COLLAPSED = 150;

/** 펼쳤을 때 차지하는 비율. 지도가 위쪽에 조금 남아야 어디를 보는 중인지 안 잊는다. */
const EXPANDED_RATIO = 0.7;

// 밖에서 시트를 내릴 때(지도를 만졌을 때)의 시간과 곡선.
//
// ⚠️ 손으로 끌 때는 **놓은 자리에 그대로 둔다**(2026-08-06 합의). 가까운 쪽으로 붙이지
//    않는다 — 네이버 지도 앱이 그렇다. 올린 만큼만 올라가고 내린 만큼만 내려가는 게
//    손에 붙는 느낌이다. 그래서 이 값은 **손을 뗐을 때가 아니라** 밖에서 내려달라고
//    할 때만 쓴다.
const COLLAPSE_MS = 240;

export interface PlaceSheetRef {
  /** 지도를 만졌을 때 부른다 — 지도를 보고 싶다는 뜻이므로 목록이 비켜 준다. */
  collapse: () => void;
}

interface Props {
  places: PlaceListItemType[];
  loading: boolean;
  onPressPlace: (id: number) => void;
  /** 손잡이 바로 아래에 놓을 것. 카테고리 알약이 여기 들어온다 — 접혀도 보여야 한다. */
  header?: ReactNode;
}

export const PlaceSheet = forwardRef<PlaceSheetRef, Props>(function PlaceSheet(
  { places, loading, onPressPlace, header },
  ref
) {
  const { height: screenHeight } = useWindowDimensions();
  const expandedHeight = Math.round(screenHeight * EXPANDED_RATIO);
  /** 접혔을 때 아래로 내려가 있는 거리. 0이면 완전히 펼쳐진 상태다. */
  const hiddenAmount = expandedHeight - COLLAPSED;

  const offset = useSharedValue(hiddenAmount);
  /** 손가락을 대기 시작한 순간의 자리. 끄는 동안 여기서부터 더하고 뺀다. */
  const startOffset = useSharedValue(hiddenAmount);

  useImperativeHandle(ref, () => ({
    collapse: () => {
      // 이미 내려가 있으면 건드리지 않는다 — 괜히 다시 움직이면 눈에 걸린다.
      if (offset.value >= hiddenAmount) return;
      offset.value = withTiming(hiddenAmount, {
        duration: COLLAPSE_MS,
        easing: Easing.out(Easing.cubic),
      });
    },
  }));

  // ⚠️ onEnd 가 없다. **놓은 자리에 그대로 둔다** — 가까운 쪽으로 붙이지 않는다.
  const pan = Gesture.Pan()
    .onStart(() => {
      startOffset.value = offset.value;
    })
    .onUpdate((e) => {
      // 위로 끌면 translationY 가 음수 → offset 이 줄어 시트가 올라온다.
      const next = startOffset.value + e.translationY;
      // 두 끝 밖으로는 안 나가게 잡아 둔다.
      offset.value = Math.min(Math.max(next, 0), hiddenAmount);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const renderItem = useCallback(
    ({ item }: { item: PlaceListItemType }) => (
      <PlaceListItem place={item} onPress={onPressPlace} />
    ),
    [onPressPlace]
  );

  const 목록있음 = !loading && places.length > 0;

  // 손잡이와 알약 줄을 한 덩어리로 묶는다. 여기를 잡고 끈다 — 알약을 눌렀을 때는
  // 알약이 먼저 받으므로 종류를 바꾸는 데 지장이 없다.
  const 잡는곳 = (
    <View accessibilityLabel="목록 끌어올리기">
      <View style={styles.handleArea}>
        <View style={styles.handle} />
      </View>
      {header}
    </View>
  );

  const 안내 = loading ? (
    <View style={styles.notice}>
      <ActivityIndicator />
      <Text style={styles.noticeText}>불러오는 중</Text>
    </View>
  ) : (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>이 지역에는 아직 없어요</Text>
      <Text style={styles.noticeHint}>지도를 옮겨 다시 찾아보세요</Text>
    </View>
  );

  return (
    <Animated.View style={[styles.sheet, { height: expandedHeight }, sheetStyle]}>
      {목록있음 ? (
        <>
          {/* 굴릴 목록이 있으니 손잡이·알약 줄에서만 끈다 — 목록까지 끌리면 세로로
              굴리는 동작과 부딪혀 둘 다 어정쩡해진다. */}
          <GestureDetector gesture={pan}>{잡는곳}</GestureDetector>
          <FlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </>
      ) : (
        /* 굴릴 게 없으니 **시트 아무 데나** 끌 수 있게 한다.
           손잡이는 손가락보다 작아서 거기만 되면 「안 끌린다」로 느껴진다
           (2026-08-06 실기기에서 실제로 그렇게 느껴졌다). */
        <GestureDetector gesture={pan}>
          <View style={styles.wholeArea}>
            {잡는곳}
            {안내}
          </View>
        </GestureDetector>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    // ⚠️ insets.bottom 을 더하지 않는다. 여기는 **탭 화면 안**이라 탭바가 이미 제스처 바를
    //    비켜 놓았다. 더하면 두 번 세게 된다 (mobile/AGENTS.md).
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // 지도 위에 떠 있다는 게 보이게. 안 그러면 지도와 붙어 한 덩어리로 읽힌다.
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  // 손잡이는 눈에 보이는 막대보다 넓게 잡는다 — 얇은 막대만 노리면 잘 안 잡힌다.
  handleArea: { paddingVertical: 12, alignItems: 'center' },
  // 굴릴 목록이 없을 때 끄는 자리. 시트에 남은 자리를 다 차지해 아무 데나 끌린다.
  wholeArea: { flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.outline },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  notice: { alignItems: 'center', paddingTop: 16, gap: 6 },
  noticeText: { fontSize: 14, color: colors.onSurfaceMuted },
  noticeHint: { fontSize: 13, color: colors.onSurfaceSubtle },
});
