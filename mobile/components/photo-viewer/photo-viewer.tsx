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
function ZoomablePhoto({ uri, width, height, onZoomChange }: ZoomablePhotoProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    // 시험에서 이 제스처를 집어 흔들어 보려고 붙인 이름이다(photo-viewer.test.tsx).
    .withTestId(PINCH_TEST_ID)
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        // 제자리로 돌려놓는다 — 1배인데 사진이 옆으로 밀려 있으면 이상하다.
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
      runOnJS(onZoomChange)(scale.value > 1);
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      x.value = savedX.value + event.translationX;
      y.value = savedY.value + event.translationY;
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
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, style]}>
        <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
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
  backdrop: { flex: 1, backgroundColor: colors.black },
  close: { position: 'absolute', top: 44, right: 12, padding: 8 },
  counter: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  counterText: { color: colors.surface, fontSize: 14 },
});
