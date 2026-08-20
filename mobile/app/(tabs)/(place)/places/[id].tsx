import { hasPlaceRating } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, MapPin, Phone, Star } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { CATEGORIES, type PlaceCategory } from '@/lib/places/types';
import { usePlaceDetail } from '@/lib/places/use-place-detail';

// 플레이스(반려동물 시설) 상세. 읽기 전용.
// 상품 상세(app/(tabs)/(home)/products/[id].tsx)와 같은 결로 짠다 — 헤더는 늘 보이고
// 로딩·오류·본문만 갈아 끼운다. 지도는 이 화면 몫이 아니다(다른 사람이 만든다 — import 안 함).
//
// ⚠️ 값이 없는 항목(전화·영업시간·별점)은 빈 줄로 남기지 않고 아예 안 그린다.
//    서버가 그 값들을 자주 비워 보낸다(types.ts 주석).
//    별점만 판별이 다르다 — reviewSummary 는 후기가 없어도 null 이 아니라 0 으로 채워 온다.
//    그래서 hasPlaceRating(@cuddle/shared)으로 「후기가 있는가」를 묻는다(#982).

/** 목록 조각(place-list-item.tsx)의 별 색과 같은 값. 새로 짓지 않는다. */
const STAR_COLOR = colors.rating;
/** 주소·전화·영업시간 아이콘. comment-row.tsx의 EllipsisVertical과 같은 회색. */
const MUTED_ICON = colors.onSurfaceSubtle;

function categoryLabel(category: PlaceCategory): string {
  return CATEGORIES.find((item) => item.key === category)?.label ?? category;
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const placeId = Number(id);

  const { place, loading, error } = usePlaceDetail(placeId);

  const renderBody = () => {
    if (loading) {
      // 회색 자리표시(스켈레톤). product-detail의 DetailSkeleton과 같은 값을 쓴다.
      return (
        <View style={styles.skeletonWrap}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonBody}>
            <View style={[styles.bar, { width: '60%', height: 22 }]} />
            <View style={[styles.bar, { width: '30%' }]} />
            <View style={[styles.bar, { width: '80%' }]} />
          </View>
        </View>
      );
    }

    if (error || !place) {
      return (
        <View style={styles.center}>
          <Text style={styles.message}>{error ?? '장소를 찾을 수 없어요'}</Text>
        </View>
      );
    }

    // 병원 전용 표시(24시·응급)는 카테고리가 병원이고 detail이 있을 때만.
    const hospitalDetail = place.category === 'HOSPITAL' ? place.detail : null;

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.image}>
          {place.imageUrl ? (
            <Image
              source={{ uri: place.imageUrl }}
              style={styles.imageFill}
              contentFit="cover"
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.name}>{place.name}</Text>

          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{categoryLabel(place.category)}</Text>
          </View>

          {hasPlaceRating(place.reviewSummary) ? (
            <View style={styles.row}>
              <Star size={14} color={STAR_COLOR} fill={STAR_COLOR} />
              <Text style={styles.infoText}>
                {`${place.reviewSummary.averageRating.toFixed(1)} (${place.reviewSummary.reviewCount})`}
              </Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <MapPin size={14} color={MUTED_ICON} />
            <Text style={styles.infoText}>{place.address}</Text>
          </View>

          {place.phone ? (
            <View style={styles.row}>
              <Phone size={14} color={MUTED_ICON} />
              <Text style={styles.infoText}>{place.phone}</Text>
            </View>
          ) : null}

          {place.operatingHours ? (
            <View style={styles.row}>
              <Clock size={14} color={MUTED_ICON} />
              <Text style={styles.infoText}>{place.operatingHours}</Text>
            </View>
          ) : null}

          {hospitalDetail && (hospitalDetail.is24Hours || hospitalDetail.isEmergencyAvailable) ? (
            <View style={styles.badgeRow}>
              {hospitalDetail.is24Hours ? (
                <View style={styles.badge24}>
                  <Text style={styles.badge24Text}>24시간</Text>
                </View>
              ) : null}
              {hospitalDetail.isEmergencyAvailable ? (
                <View style={styles.badgeEmergency}>
                  <Text style={styles.badgeEmergencyText}>응급진료</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 제목을 넣지 않는다 — 이 앱의 상세 헤더는 뒤로가기만 둔다(상품 상세와 같다).
          이름은 바로 아래 본문 맨 위에 크게 나오므로 헤더에 또 쓰면 같은 말이 두 번이고,
          이름이 길면 헤더에서 잘린다. 이름이 오기 전에 「장소」 같은 임시 글자를 띄우면
          진짜 이름으로 바뀌는 순간 글자가 튄다. */}
      <ScreenHeader onPressIcon={() => router.back()} />
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  // 로드 전/이미지 없음일 때의 회색 자리 — place-list-item.tsx의 thumb과 같은 색.
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.outlineVariant,
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  section: {
    padding: 16,
    gap: 10,
  },
  // 제목 20/700 = 상품 상세 제목(product-summary.tsx)과 같은 값.
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  // 카테고리 알약 — 상품 상세의 상태 뱃지(badgeOutline)와 같은 값.
  categoryTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // 주소·전화·영업시간·별점 글자 — profile-head.tsx의 introduction과 같은 값.
  infoText: {
    fontSize: 14,
    color: colors.onSurfaceMedium,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  // 24시간 — place-list-item.tsx의 24시 뱃지와 같은 값(주황).
  badge24: {
    borderRadius: 999,
    backgroundColor: colors.badgeRequestBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badge24Text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.badgeRequest,
  },
  // 응급진료 — profile-head.tsx의 차단 뱃지와 같은 값(빨강).
  badgeEmergency: {
    borderRadius: 999,
    backgroundColor: colors.dangerSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeEmergencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  skeletonWrap: {
    flex: 1,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.outlineVariant,
  },
  skeletonBody: {
    padding: 16,
    gap: 10,
  },
  bar: {
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.outlineVariant,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
});
