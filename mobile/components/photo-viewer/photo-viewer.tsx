import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

// 앱 사진 확대창(#904). 화면을 덮고 **잘리지 않게**(contain) 보여준다.
//
// ⚠️ 안드로이드에서 Modal 안은 별개의 창이라, 바깥(app/_layout.tsx)에 씌운
//    GestureHandlerRootView 가 여기까지 닿지 않는다. 다시 감싸지 않으면 **오류 없이
//    조용히 안 끌린다**(bottom-sheet.tsx 에 같은 함정이 적혀 있다).
//
// ⚠️ 넓힐수록 뭉갠다 — 올라온 사진이 800px 뿐이라 그렇다. 확대는 「더 선명해지는」 것이
//    아니라 「잘려 있던 자리를 보고, 뭉개짐을 감수하고 크게 보는」 것이다.

export const PAGER_TEST_ID = 'photo-viewer-pager';
export const PINCH_TEST_ID = 'photo-viewer-pinch';

/** 넓힐 수 있는 한계. 올라온 사진이 800px 뿐이라 더 가면 뭉개짐만 는다 */
const MAX_SCALE = 3;
/** 두 번 톡톡 쳤을 때의 배율 */
const DOUBLE_TAP_SCALE = 2;
/** X 단추·점 표시가 사라졌다 나타나는 데 걸리는 시간 */
const UI_FADE_MS = 180;

interface ZoomablePhotoProps {
  uri: string;
  width: number;
  height: number;
  /** 넓힌 상태가 바뀌면 알린다. 좌우 넘기기를 켜고 끄는 데 쓴다 */
  onZoomChange: (zoomed: boolean) => void;
}

// 사진 한 장. 넓히고(핀치) · 두 번 쳐서 키우고(더블탭) · 끌어서 움직인다(팬).
//
// ⚠️ 끌기는 **넓힌 상태에서만** 듣는다. 1배일 때 끌면 좌우 넘기기가 해야 할 일이다.
//
// ⚠️ **웹과 일부러 다르다.** 웹은 틀을 고정하고 그 안에서만 키우는데, 앱은 넓히면
//    **화면 전체를 채운다.** 폰은 화면이 좁아서 틀 안에만 키우면 답답하고, 사진을 볼 때는
//    X 단추·점 표시 같은 것이 오히려 방해가 된다(그래서 넓히면 그것들도 사라진다).
//    데스크탑은 화면이 넓어 틀이 고정이라도 답답하지 않고, 오히려 단추가 제자리에 있는
//    편이 낫다.
function ZoomablePhoto({ uri, width, height, onZoomChange }: ZoomablePhotoProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  /** 화면 쪽에 「넓힘」을 마지막으로 알린 값. 바뀔 때만 알리려고 둔다 */
  const 넓힘알림 = useSharedValue(0);

  // 사진 알갱이 크기를 알아야 틀을 잡는다. 읽기 전에는 화면 크기를 쓴다.
  //
  // ⚠️ **웹과 일부러 다른 곳이 하나 있다.** 웹은 「원본보다 크게는 안 키운다」인데
  //    여기서는 화면에 맞춰 키운다. 폰에서는 800px 사진이 화면 폭(기기 픽셀로 1000 넘음)
  //    보다 작아서, 안 키우면 손바닥만 하게 뜬다. 같은 규칙이 매체마다 다른 결과를 낸다.
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const 맞춤배율 = natural ? Math.min(width / natural.width, height / natural.height) : 1;
  const frame = natural
    ? { width: natural.width * 맞춤배율, height: natural.height * 맞춤배율 }
    : { width, height };

  // ⚠️ 제스처 안(손가락 쪽 스레드)에서는 **숫자만** 꺼내 쓴다. 거기서 바깥 함수를 부르면
  //    「UI 스레드에서 일반 함수를 불렀다」로 죽는다. 그래서 미리 숫자로 담아 둔다.
  //
  // 끌 수 있는 거리는 **화면 밖으로 숨은 만큼**이다. 사진이 화면보다 작으면 0 —
  // 끌 데가 없다. (틀 기준으로 재면 화면에 다 보이는데도 끌리는 이상한 일이 생긴다.)
  const frameWidth = frame.width;
  const frameHeight = frame.height;
  const screenWidth = width;
  const screenHeight = height;

  const pinch = Gesture.Pinch()
    // 시험에서 이 제스처를 집어 흔들어 보려고 붙인 이름이다(photo-viewer.test.tsx).
    .withTestId(PINCH_TEST_ID)
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), MAX_SCALE);
      // 손을 떼기 전에 알린다 — 넓히는 **동안** X 단추·점 표시가 사라져야 자연스럽다.
      // 바뀔 때 한 번만 건넨다(매 프레임 건네면 화면 쪽이 밀린다).
      const 지금넓힘 = scale.value > 1 ? 1 : 0;
      if (지금넓힘 !== 넓힘알림.value) {
        넓힘알림.value = 지금넓힘;
        runOnJS(onZoomChange)(지금넓힘 === 1);
      }
      // 줄이는 동안 사진이 틀 밖으로 삐져나오지 않게 같이 당긴다.
      const 끝X = Math.max(0, (frameWidth * scale.value - screenWidth) / 2);
      const 끝Y = Math.max(0, (frameHeight * scale.value - screenHeight) / 2);
      x.value = Math.min(Math.max(x.value, -끝X), 끝X);
      y.value = Math.min(Math.max(y.value, -끝Y), 끝Y);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        // 제자리로 돌려놓는다 — 1배인데 사진이 옆으로 밀려 있으면 이상하다.
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      } else {
        savedX.value = x.value;
        savedY.value = y.value;
      }
      runOnJS(onZoomChange)(scale.value > 1);
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      const 끝X = Math.max(0, (frameWidth * scale.value - screenWidth) / 2);
      const 끝Y = Math.max(0, (frameHeight * scale.value - screenHeight) / 2);
      x.value = Math.min(Math.max(savedX.value + event.translationX, -끝X), 끝X);
      y.value = Math.min(Math.max(savedY.value + event.translationY, -끝Y), 끝Y);
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1 ? 1 : DOUBLE_TAP_SCALE;
      scale.value = withTiming(next);
      savedScale.value = next;
      if (next === 1) {
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
      runOnJS(onZoomChange)(next > 1);
    });

  // 핀치는 끌기·더블탭과 **같이** 돈다(두 손가락과 한 손가락은 겨룰 일이 없다).
  // 끌기와 더블탭은 서로 겨루므로 하나만 이기게 둔다.
  const gesture = Gesture.Simultaneous(Gesture.Exclusive(doubleTap, pan), pinch);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <View style={[styles.page, { width, height }]}>
      <GestureDetector gesture={gesture}>
        {/* 자르지 않는다 — 넓히면 화면 전체로 퍼진다 */}
        <Animated.View style={[{ width: frame.width, height: frame.height }, style]}>
          <Image
            source={{ uri }}
            style={{ width: frame.width, height: frame.height }}
            contentFit="contain"
            onLoad={(event) =>
              setNatural({ width: event.source.width, height: event.source.height })
            }
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

interface PhotoViewerProps {
  images: string[];
  startIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function PhotoViewer({ images, startIndex = 0, visible, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const pagerRef = useRef<FlatList<string>>(null);

  // 넓히면 X 단추와 점 표시를 **스르륵 감춘다.** 사진을 볼 때 방해가 되기 때문이다.
  // 줄이면 다시 스르륵 나타난다.
  const uiOpacity = useSharedValue(1);
  useEffect(() => {
    uiOpacity.value = withTiming(zoomed ? 0 : 1, { duration: UI_FADE_MS });
  }, [zoomed, uiOpacity]);
  const uiStyle = useAnimatedStyle(() => ({ opacity: uiOpacity.value }));

  // 열 때마다 누른 사진에서 시작한다.
  useEffect(() => {
    if (visible) {
      setIndex(startIndex);
      setZoomed(false);
    }
  }, [visible, startIndex]);

  return (
    <Modal
      testID="photo-viewer-modal"
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <FlatList
            ref={pagerRef}
            testID={PAGER_TEST_ID}
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={startIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            onMomentumScrollEnd={(event) =>
              setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
            }
            scrollEnabled={!zoomed}
            renderItem={({ item }) => (
              <ZoomablePhoto uri={item} width={width} height={height} onZoomChange={setZoomed} />
            )}
          />

          {/* 넓히면 사라지는 것들. 사라진 동안은 눌리지도 않아야 한다 */}
          <Animated.View
            style={[styles.ui, uiStyle]}
            pointerEvents={zoomed ? 'none' : 'box-none'}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={styles.close}
              hitSlop={12}
            >
              <X size={28} color={colors.surface} />
            </Pressable>

            {/* 점 하나가 사진 한 장이다. 누르면 그 사진으로 간다 —
                폰에는 좌우 화살표를 둘 자리가 없어 점이 그 몫을 한다.
                모양은 상품 상세의 점 표시와 같다(product-detail/image-carousel.tsx). */}
            {images.length > 1 ? (
              <View style={styles.dots}>
                {images.map((uri, i) => (
                  <Pressable
                    key={`${uri}-dot-${i}`}
                    testID={`photo-viewer-dot-${i}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${i + 1}번째 사진`}
                    // 지금 보는 사진이 어느 것인지 낭독기에도 알린다. 시험도 이걸 본다
                    accessibilityState={{ selected: i === index }}
                    hitSlop={10}
                    onPress={() => pagerRef.current?.scrollToIndex({ index: i, animated: true })}
                  >
                    <View style={[styles.dot, i === index && styles.dotActive]} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // 한 장이 차지하는 자리(화면 한 장). 그 안에 틀을 가운데 놓는다
  page: { alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.black },
  // 사라졌다 나타나는 것들을 한 겹으로 묶는다. 자리를 안 먹게 화면 전체에 깔고,
  // box-none 이라 이 겹 자체는 터치를 안 먹는다(안의 단추만 먹는다).
  ui: { ...StyleSheet.absoluteFillObject },
  close: { position: 'absolute', top: 44, right: 12, padding: 8 },
  dots: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  dotActive: { backgroundColor: colors.surface },
});
