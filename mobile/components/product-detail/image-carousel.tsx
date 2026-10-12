import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer/photo-viewer';
import { colors } from '@/constants/colors';
import { getOverlay } from '@/lib/tradeStatus';

// 상세 대표 이미지. 메인 + 서브를 이어 가로로 스와이프한다.
// 실데이터는 대부분 1장이고, 1장이면 점 표시가 나오지 않는다.
// 거래상태 오버레이 규칙은 홈 썸네일과 같다(UI 스펙 §5).

// 사진이 한 장도 없을 때 메우는 기본 그림(#1120). 사진은 필수가 아니라 없는 상품이 실제로 생긴다.
// 웹 상세(MainImage.tsx)가 쓰는 public/images/placeholder-800.webp 와 같은 파일이고,
// 장소 상세가 이미 쓰고 있어 새로 들이지 않는다.
const PLACEHOLDER = require('@/assets/images/place-placeholder.webp');

interface Props {
  mainImageUrl: string;
  subImageUrls: string[];
  tradeStatus: string | null;
  productType: string;
}

export function ImageCarousel({ mainImageUrl, subImageUrls, tradeStatus, productType }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  // 확대창. 누른 사진에서 시작한다.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const images = [mainImageUrl, ...subImageUrls].filter(Boolean);
  const overlay = getOverlay(tradeStatus, productType);

  return (
    <View style={[styles.container, { width, height: width }]}>
      {images.length === 0 && (
        // ⚠️ 누를 수 없게 둔다 — 확대해 볼 사진이 없다.
        <Image
          testID="detail-photo-placeholder"
          source={PLACEHOLDER}
          style={{ width, height: width }}
          contentFit="cover"
        />
      )}
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(url, i) => `${url}-${i}`}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index: i }) =>
          failedUrls.includes(item) ? (
            // 로드 실패 시 회색 자리(홈 썸네일과 같은 처리).
            // ⚠️ 여기는 누를 수 없게 그대로 둔다 — 띄울 사진이 없다.
            <View style={{ width, height: width, backgroundColor: colors.outlineVariant }} />
          ) : (
            <Pressable testID={`detail-photo-${i}`} onPress={() => setViewerIndex(i)}>
              <Image
                source={{ uri: item }}
                style={{ width, height: width }}
                contentFit="cover"
                onError={() => setFailedUrls((prev) => [...prev, item])}
              />
            </Pressable>
          )
        }
      />

      {overlay && (
        <View style={[styles.scrim, { backgroundColor: overlay.scrim }]} pointerEvents="none">
          <View style={styles.pill}>
            <Text style={styles.pillText}>{overlay.label}</Text>
          </View>
        </View>
      )}

      {images.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {images.map((url, i) => (
            <View key={`${url}-dot-${i}`} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}

      <PhotoViewer
        images={images}
        startIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.outlineVariant,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: colors.surface,
  },
});
