import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Star } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import type { PlaceListItem as PlaceListItemType } from '@/lib/places/types';

// 플레이스 목록 한 줄. 상품 목록 카드(components/product-card.tsx)와 같은 꼴로 맞춘다 —
// 왼쪽 정사각 사진 + 오른쪽 정보(가로 카드).
//
// ⚠️ 사진이 없거나 로드에 실패하면 **사진 자리를 아예 안 그린다**(#978). 상품과 다른 점이다.
// 이 화면의 장소는 정부 공개 API 에서 오는데 사진이 붙은 곳이 거의 없어서, 자리를 남기면
// 뜻 없는 회색 네모만 줄줄이 늘어선다. 웹(src/features/map/PlaceList.tsx)도 `place.imageUrl &&`
// 로 있을 때만 그린다. 실패를 아는 방법은 상품과 같다(product-thumbnail.tsx: onError로 상태만 바꾼다).
//
// 별점·24시 뱃지는 지도 없이도 그릴 수 있는 목록 정보라 이 조각이 맡는다(지도는 다른 사람 몫).

const THUMB_SIZE = 72;
// 시험에서 「사진 자리가 사라졌는가」를 보려면 표식이 있어야 한다 — 회색 상자는 글자가 없다.
export const THUMB_TEST_ID = 'place-thumb';
export const THUMB_IMAGE_TEST_ID = 'place-thumb-image';
// 웹 사이드바(src/features/map/PlaceListSidebar.tsx)의 text-yellow-400과 같은 노랑.
const STAR_COLOR = colors.rating;

interface Props {
  place: PlaceListItemType;
  onPress: (id: number) => void;
}

export function PlaceListItem({ place, onPress }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(place.imageUrl) && !failed;
  // 24시는 병원에만 있는 필드다(detail은 병원이 아니면 null) — 카테고리까지 같이 본다.
  const show24Hours = place.category === 'HOSPITAL' && place.detail?.is24Hours === true;

  return (
    <Pressable
      onPress={() => onPress(place.id)}
      accessibilityRole="button"
      accessibilityLabel={`${place.name} 상세 보기`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {showImage ? (
        <View style={styles.thumb} testID={THUMB_TEST_ID}>
          <Image
            source={{ uri: place.imageUrl as string }}
            style={styles.thumbImage}
            contentFit="cover"
            onError={() => setFailed(true)}
            testID={THUMB_IMAGE_TEST_ID}
          />
        </View>
      ) : null}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {place.address}
        </Text>

        {/* 별점(있을 때만)과 24시 뱃지(병원 + 실측 true일 때만)를 한 줄에. */}
        <View style={styles.metaRow}>
          {place.reviewSummary ? (
            <View style={styles.rating}>
              <Star size={12} color={STAR_COLOR} fill={STAR_COLOR} />
              <Text style={styles.ratingText}>
                {`${place.reviewSummary.averageRating.toFixed(1)} (${place.reviewSummary.reviewCount})`}
              </Text>
            </View>
          ) : null}

          {show24Hours ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>24시</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
  },
  rowPressed: {
    opacity: 0.7,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    // 로드가 끝나기 전 잠깐 보이는 회색 자리(product-thumbnail.tsx와 같은 값).
    // 실패하면 이 상자째 사라진다.
    backgroundColor: colors.outlineVariant,
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
  },
  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  address: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
  // 상품 카드의 판매요청 뱃지(주황)와 같은 값을 쓴다 — 눈에 띄어야 하는 정보라는 결이 같다.
  badge: {
    borderRadius: 999,
    backgroundColor: colors.badgeRequestBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.badgeRequest,
  },
});
