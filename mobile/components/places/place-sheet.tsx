import { useCallback } from 'react';
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
import type { PlaceListItem as PlaceListItemType } from '@/lib/places/types';

// 지도 위에 떠 있는 목록. 손가락으로 끌어올린다.
//
// 카카오맵·네이버지도·당근 동네지도가 모두 이 모양이다. 지도를 보면서 목록도 볼 수 있다.
// 탭으로 전환하는 방식이면 「지도에서 본 자리」와 「목록」을 동시에 못 봐서 오가는 수고가 생긴다.
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
// 옮기기는 배치를 안 건드려서 매끄럽다.
//
//   펼침   translateY = 0
//   접힘   translateY = 펼친높이 − 접힌높이   (그만큼 화면 밖으로 내려가 있다)

/** 접었을 때 보이는 높이. 손잡이 + 한 줄 반쯤 보여서 「더 있다」가 읽힌다. */
const COLLAPSED = 150;

/** 펼쳤을 때 차지하는 비율. 지도가 위쪽에 조금 남아야 어디를 보는 중인지 안 잊는다. */
const EXPANDED_RATIO = 0.7;

/** 이만큼 빨리 튕기면 위치와 상관없이 그 방향으로 붙인다. 천천히 끌면 가까운 쪽으로. */
const FLING_SPEED = 500;

// 붙는 데 걸리는 시간과 곡선. **용수철(withSpring)을 쓰지 않는다.**
//
// 처음엔 withSpring 으로 짰는데 실기기에서 **통통 튀었다**(2026-08-06). 이 앱의
// 기존 시트(components/ui/bottom-sheet.tsx)가 같은 이유로 이미 시간·곡선 방식을 쓴다.
//
// ⚠️ **곡선은 그 시트와 다르게 간다. 하는 일이 다르기 때문이다.**
//
//    기존 시트   화면 **밖으로 사라진다**  → 닫을 때 Easing.in(가속)이 맞다.
//                                          점점 빨라지며 나가는 게 자연스럽다
//    이 시트     두 자리 **사이를 오간다**  → 양쪽 다 Easing.out(감속)이 맞다.
//                                          도착해서 멈춰야 하니까
//
//    처음에 그 시트 값을 그대로 가져와 닫을 때 Easing.in 을 썼더니, 내릴 때
//    **멈칫하다 덜컥 떨어졌다**(2026-08-06 실기기). 가속 곡선은 앞부분이 거의
//    안 움직여서 「걸렸다」로 읽힌다.
const OPEN_MS = 300;
const CLOSE_MS = 240;

interface Props {
  places: PlaceListItemType[];
  loading: boolean;
  onPressPlace: (id: number) => void;
}

export function PlaceSheet({ places, loading, onPressPlace }: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const expandedHeight = Math.round(screenHeight * EXPANDED_RATIO);
  /** 접혔을 때 아래로 내려가 있는 거리. 0이면 완전히 펼쳐진 상태다. */
  const hiddenAmount = expandedHeight - COLLAPSED;

  const offset = useSharedValue(hiddenAmount);
  /** 손가락을 대기 시작한 순간의 자리. 끄는 동안 여기서부터 더하고 뺀다. */
  const startOffset = useSharedValue(hiddenAmount);

  const pan = Gesture.Pan()
    .onStart(() => {
      startOffset.value = offset.value;
    })
    .onUpdate((e) => {
      // 위로 끌면 translationY 가 음수 → offset 이 줄어 시트가 올라온다.
      const next = startOffset.value + e.translationY;
      // 두 자리 밖으로는 안 나가게 잡아 둔다.
      offset.value = Math.min(Math.max(next, 0), hiddenAmount);
    })
    .onEnd((e) => {
      // 어디로 붙일지 먼저 정한다.
      // 빠르게 튕겼으면 그 방향을 따른다 — 사람은 「휙」 올리면 끝까지 가길 기대한다.
      // 천천히 놓았으면 가까운 쪽으로.
      const 펼침 =
        e.velocityY < -FLING_SPEED
          ? true
          : e.velocityY > FLING_SPEED
            ? false
            : offset.value < hiddenAmount / 2;

      offset.value = withTiming(펼침 ? 0 : hiddenAmount, {
        duration: 펼침 ? OPEN_MS : CLOSE_MS,
        // 양쪽 다 감속이다. 접을 때만 조금 빠르다 — 이미 결정한 동작이라 기다릴 이유가 없다.
        easing: Easing.out(Easing.cubic),
      });
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

  const 손잡이 = (
    <View style={styles.handleArea} accessibilityLabel="목록 끌어올리기">
      <View style={styles.handle} />
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
      <Text style={styles.noticeHint}>지도를 옮겨 다른 동네를 찾아보세요</Text>
    </View>
  );

  return (
    <Animated.View style={[styles.sheet, { height: expandedHeight }, sheetStyle]}>
      {목록있음 ? (
        <>
          {/* 굴릴 목록이 있으니 손잡이에서만 끈다 — 목록까지 끌리면 세로로 굴리는
              동작과 부딪혀 둘 다 어정쩡해진다. */}
          <GestureDetector gesture={pan}>{손잡이}</GestureDetector>
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
            {손잡이}
            {안내}
          </View>
        </GestureDetector>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    // ⚠️ insets.bottom 을 더하지 않는다. 여기는 **탭 화면 안**이라 탭바가 이미 제스처 바를
    //    비켜 놓았다. 더하면 두 번 세게 된다 (mobile/AGENTS.md 의 「Expo Go에서 맞춘
    //    아래쪽 여백」 항목).
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // 지도 위에 떠 있다는 게 보이게. 안 그러면 지도와 붙어 한 덩어리로 읽힌다.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  // 손잡이는 눈에 보이는 막대보다 넓게 잡는다 — 얇은 막대만 노리면 잘 안 잡힌다.
  // 16이면 막대(4) 위아래로 손가락 하나가 들어간다.
  handleArea: { paddingVertical: 16, alignItems: 'center' },
  // 굴릴 목록이 없을 때 끄는 자리. 시트에 남은 자리를 다 차지해 아무 데나 끌린다.
  wholeArea: { flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  notice: { alignItems: 'center', paddingTop: 16, gap: 6 },
  noticeText: { fontSize: 14, color: '#6B7280' },
  noticeHint: { fontSize: 13, color: '#9CA3AF' },
});
