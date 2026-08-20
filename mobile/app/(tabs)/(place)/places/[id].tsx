import { hasPlaceRating } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Clock, MapPin, Phone, Star } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { CATEGORIES, type PlaceCategory } from '@/lib/places/types';
import { usePlaceDetail } from '@/lib/places/use-place-detail';

// 플레이스(반려동물 시설) 상세. 읽기 전용.
// 상품 상세(app/(tabs)/(home)/products/[id].tsx)와 같은 결로 짠다 — 헤더는 늘 보이고
// 로딩·오류·본문만 갈아 끼운다. 지도는 이 화면 몫이 아니다(다른 사람이 만든다 — import 안 함).
//
// ⚠️ 읽는 값(이름·주소·전화·영업시간)에는 selectable 을 단다 — RN 의 <Text> 는 기본이
//    선택 불가라 꾹 눌러도 복사가 안 된다(#896·#988). 주소는 다른 지도 앱에 붙여 넣는 값이라
//    복사 수요가 크다. 별점 숫자에는 안 단다. 목록 행(place-list-item.tsx)에도 안 단다 —
//    Pressable 안이라 꾹 누르면 탭이 씹힌다(mobile/AGENTS.md).
//
// ⚠️ 값이 없는 항목(전화·영업시간·별점)은 빈 줄로 남기지 않고 아예 안 그린다.
//    서버가 그 값들을 자주 비워 보낸다(types.ts 주석).
//    별점만 판별이 다르다 — reviewSummary 는 후기가 없어도 null 이 아니라 0 으로 채워 온다.
//    그래서 hasPlaceRating(@cuddle/shared)으로 「후기가 있는가」를 묻는다(#982).

/** 목록 조각(place-list-item.tsx)의 별 색과 같은 값. 새로 짓지 않는다. */
const STAR_COLOR = colors.rating;
/** 주소·전화·영업시간 아이콘. comment-row.tsx의 EllipsisVertical과 같은 회색. */
const MUTED_ICON = colors.onSurfaceSubtle;

// 사진이 없을 때 메우는 기본 그림. 웹의 public/images/placeholder-800.webp 를 그대로 옮겨 왔다
// (상품 목록이 쓰던 것과 같은 그림이라 브랜드 결이 맞는다). 새로 짓지 않는다.
//
// ⚠️ 목록(place-list-item.tsx)은 반대로 **자리를 아예 없앤다**(#978). 거기는 72×72 가 22줄
//    반복돼 같은 그림이 줄줄이 늘어서기 때문이다. 여기는 390×390 이 한 번뿐이라 메우는 쪽이 낫다.
const PLACEHOLDER = require('@/assets/images/place-placeholder.webp');

function categoryLabel(category: PlaceCategory): string {
  return CATEGORIES.find((item) => item.key === category)?.label ?? category;
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const placeId = Number(id);

  const { place, loading, error } = usePlaceDetail(placeId);
  // 사진 주소가 있어도 못 받아 올 수 있다. 그때도 기본 그림으로 메운다.
  const [imageFailed, setImageFailed] = useState(false);

  // 고른 글자를 푸는 열쇠(#989). 이 값이 바뀌면 selectable 글자들이 **다시 그려지고**,
  // 그 김에 안드로이드의 선택도 함께 풀린다.
  //
  // ⚠️ 안드로이드의 글자 선택은 **그 글자가 초점을 잃을 때** 풀리는데, RN 화면의 다른 요소
  //    (View·이미지)는 초점을 안 가져간다. 그래서 빈 곳을 눌러도 선택이 그대로 남는다.
  //    RN 이슈판에서 쓰는 우회법이 이 「다시 그리기」다. 우리 실수가 아니라 RN 의 동작이다.
  const [선택열쇠, set선택열쇠] = useState(0);
  const 선택풀기 = () => set선택열쇠((n) => n + 1);

  // ⚠️ 사진 값을 붙잡아 둔다. 그냥 두면 **다시 그릴 때마다 새 객체**가 되어 expo-image 가
  //    「사진이 바뀌었다」로 보고 390px 그림을 다시 그린다 — 선택을 풀 때마다 그 값을 치르면
  //    「푸는 게 느리다」로 느껴진다.
  const 사진 = useMemo(
    () => (place?.imageUrl && !imageFailed ? { uri: place.imageUrl } : PLACEHOLDER),
    [place?.imageUrl, imageFailed]
  );

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
        {/* 빈 곳을 누르면 고른 글자를 푼다(#989). **배경에 깐다** — 글자를 감싸면
            누름을 가로채 꾹 누르기가 죽는다(실기기에서 확인했다).
            accessible={false} 라야 화면이 단추 하나로 안 읽힌다. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          // ⚠️ onPress 가 아니라 **onPressIn** 이다. onPress 는 손을 뗀 뒤에 불려서
          //    「눌렀는데 한 박자 늦게 풀린다」로 느껴진다(실기기에서 확인했다).
          //    손이 닿는 즉시 푼다. 훑기 시작할 때도 풀리는데 그게 보통 앱의 결이다.
          onPressIn={선택풀기}
          accessible={false}
          testID="place-detail-backdrop"
        />
        <View style={styles.image}>
          <Image
            // 표식을 상수로 빼서 export 하지 않는다 — expo-router 는 app/ 안의 것을 화면으로 본다.
            testID="place-detail-image"
            source={사진}
            style={styles.imageFill}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        </View>

        <View style={styles.section}>
          <Text key={`name-${선택열쇠}`} selectable style={styles.name}>
            {place.name}
          </Text>

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
            <Text key={`address-${선택열쇠}`} selectable style={styles.infoText}>
              {place.address}
            </Text>
          </View>

          {place.phone ? (
            <View style={styles.row}>
              <Phone size={14} color={MUTED_ICON} />
              <Text key={`phone-${선택열쇠}`} selectable style={styles.infoText}>
                {place.phone}
              </Text>
            </View>
          ) : null}

          {place.operatingHours ? (
            <View style={styles.row}>
              <Clock size={14} color={MUTED_ICON} />
              <Text key={`hours-${선택열쇠}`} selectable style={styles.infoText}>
                {place.operatingHours}
              </Text>
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
    // 내용이 짧아도 배경(선택 풀기)이 화면 아래까지 깔리게 한다.
    flexGrow: 1,
  },
  // 그림을 받는 동안 잠깐 보이는 회색 자리 — place-list-item.tsx의 thumb과 같은 색.
  // 사진이 없어도 기본 그림이 덮으므로 회색이 그대로 남지는 않는다.
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
