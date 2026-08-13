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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

interface PhotoViewerProps {
  images: string[];
  startIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function PhotoViewer({ images, startIndex = 0, visible, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);

  // 열 때마다 누른 사진에서 시작한다.
  useEffect(() => {
    if (visible) setIndex(startIndex);
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
            renderItem={({ item }) => (
              <View style={{ width, height }}>
                <Image source={{ uri: item }} style={{ width, height }} contentFit="contain" />
              </View>
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
