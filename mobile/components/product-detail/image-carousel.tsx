import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getOverlay } from '@/lib/tradeStatus';

// 상세 대표 이미지. 메인 + 서브를 이어 가로로 스와이프한다.
// 실데이터는 대부분 1장이고, 1장이면 점 표시가 나오지 않는다.
// 거래상태 오버레이 규칙은 홈 썸네일과 같다(UI 스펙 §5).

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

  const images = [mainImageUrl, ...subImageUrls].filter(Boolean);
  const overlay = getOverlay(tradeStatus, productType);

  return (
    <View style={[styles.container, { width, height: width }]}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(url, i) => `${url}-${i}`}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) =>
          failedUrls.includes(item) ? (
            // 로드 실패 시 회색 자리(홈 썸네일과 같은 처리)
            <View style={{ width, height: width, backgroundColor: '#E5E7EB' }} />
          ) : (
            <Image
              source={{ uri: item }}
              style={{ width, height: width }}
              contentFit="cover"
              onError={() => setFailedUrls((prev) => [...prev, item])}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
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
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
  },
});
