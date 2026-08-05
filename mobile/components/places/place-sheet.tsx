import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

/** 접었을 때 보이는 높이. 손잡이 + 한 줄 반쯤 보여서 「더 있다」가 읽힌다. */
const COLLAPSED = 150;

/** 펼쳤을 때 차지하는 비율. 지도가 위쪽에 조금 남아야 어디를 보는 중인지 안 잊는다. */
const EXPANDED_RATIO = 0.7;

/** 이만큼 빨리 튕기면 위치와 상관없이 그 방향으로 붙인다. 천천히 끌면 가까운 쪽으로. */
const FLING_SPEED = 500;

interface Props {
  places: PlaceListItemType[];
  loading: boolean;
  onPressPlace: (id: number) => void;
}

export function PlaceSheet({ places, loading, onPressPlace }: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const expanded = Math.round(screenHeight * EXPANDED_RATIO);

  // 시트 높이를 직접 움직인다. 위로 끌면 커지고 아래로 끌면 작아진다.
  const height = useSharedValue(COLLAPSED);
  // 손가락을 대기 시작한 순간의 높이. 끄는 동안 여기서부터 더하고 뺀다.
  const startHeight = useSharedValue(COLLAPSED);

  const pan = Gesture.Pan()
    .onStart(() => {
      startHeight.value = height.value;
    })
    .onUpdate((e) => {
      // 화면 좌표는 아래로 갈수록 커진다. 위로 끌면 translationY 가 음수라 높이가 는다.
      const next = startHeight.value - e.translationY;
      // 두 자리 밖으로는 안 나가게 잡아 둔다. 안 잡으면 화면 밖까지 늘어난다.
      height.value = Math.min(Math.max(next, COLLAPSED), expanded);
    })
    .onEnd((e) => {
      // 빠르게 튕겼으면 그 방향을 따른다 — 사람은 「휙」 올리면 끝까지 가길 기대한다.
      if (e.velocityY < -FLING_SPEED) {
        height.value = withSpring(expanded, { damping: 20 });
        return;
      }
      if (e.velocityY > FLING_SPEED) {
        height.value = withSpring(COLLAPSED, { damping: 20 });
        return;
      }
      // 천천히 놓았으면 가까운 쪽으로 붙인다.
      const middle = (COLLAPSED + expanded) / 2;
      height.value = withSpring(height.value > middle ? expanded : COLLAPSED, { damping: 20 });
    });

  const sheetStyle = useAnimatedStyle(() => ({ height: height.value }));

  const renderItem = useCallback(
    ({ item }: { item: PlaceListItemType }) => (
      <PlaceListItem place={item} onPress={onPressPlace} />
    ),
    [onPressPlace]
  );

  return (
    <Animated.View style={[styles.sheet, sheetStyle]}>
      {/* 손잡이만 끌 수 있게 한다. 목록까지 끌리면 스크롤과 부딪혀 둘 다 어정쩡해진다. */}
      <GestureDetector gesture={pan}>
        <View style={styles.handleArea} accessibilityLabel="목록 끌어올리기">
          <View style={styles.handle} />
        </View>
      </GestureDetector>

      {loading ? (
        <View style={styles.notice}>
          <ActivityIndicator />
          <Text style={styles.noticeText}>불러오는 중</Text>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>이 지역에는 아직 없어요</Text>
          <Text style={styles.noticeHint}>지도를 옮겨 다른 동네를 찾아보세요</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          // 접힌 상태에서는 목록을 굴리지 않는다 — 먼저 끌어올리라는 뜻이다.
          keyboardShouldPersistTaps="handled"
        />
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
  handleArea: { paddingVertical: 12, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  notice: { alignItems: 'center', paddingTop: 16, gap: 6 },
  noticeText: { fontSize: 14, color: '#6B7280' },
  noticeHint: { fontSize: 13, color: '#9CA3AF' },
});
