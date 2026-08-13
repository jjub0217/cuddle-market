import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
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
// ⚠️ **틀이 고정이다** — 넓혀도 사진 틀은 안 커지고, 넘치는 부분은 잘린다.
//    웹과 같게 맞춘 것이다(웹 PhotoViewer.tsx). 틀이 안 흔들려야 화면이 출렁이지 않는다.
//    틀 크기는 사진 비율을 화면 안에 맞춰 구한다.
function ZoomablePhoto({ uri, width, height, onZoomChange }: ZoomablePhotoProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

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
  const frameWidth = frame.width;
  const frameHeight = frame.height;

  const pinch = Gesture.Pinch()
    // 시험에서 이 제스처를 집어 흔들어 보려고 붙인 이름이다(photo-viewer.test.tsx).
    .withTestId(PINCH_TEST_ID)
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), MAX_SCALE);
      // 줄이는 동안 사진이 틀 밖으로 삐져나오지 않게 같이 당긴다.
      const 끝X = (frameWidth * (scale.value - 1)) / 2;
      const 끝Y = (frameHeight * (scale.value - 1)) / 2;
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
      const 끝X = (frameWidth * (scale.value - 1)) / 2;
      const 끝Y = (frameHeight * (scale.value - 1)) / 2;
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
      {/* 틀 — 크기가 고정이다. 안에서 사진만 커지고 넘치면 잘린다 */}
      <View style={[styles.frame, { width: frame.width, height: frame.height }]}>
        <GestureDetector gesture={gesture}>
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={onClose}
            style={styles.close}
            hitSlop={12}
          >
            <X size={28} color={colors.surface} />
          </Pressable>

          {images.length > 1 ? (
            <View style={styles.counter} pointerEvents="none">
              <Text style={styles.counterText}>
                {index + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // 한 장이 차지하는 자리(화면 한 장). 그 안에 틀을 가운데 놓는다
  page: { alignItems: 'center', justifyContent: 'center' },
  // 틀 — 넘치는 부분을 잘라 낸다. 이게 있어야 넓혀도 사진이 화면으로 퍼지지 않는다
  frame: { overflow: 'hidden' },
  backdrop: { flex: 1, backgroundColor: colors.black },
  close: { position: 'absolute', top: 44, right: 12, padding: 8 },
  counter: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  counterText: { color: colors.surface, fontSize: 14 },
});
