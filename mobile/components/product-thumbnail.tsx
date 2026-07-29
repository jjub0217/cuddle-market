import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { getOverlay } from '@/lib/tradeStatus';

// 1:1 정사각 썸네일 + 거래상태 오버레이(UI 스펙 §4.2, §5).
// 오버레이는 판매중/요청중=없음, 예약중=스크림0.40, 완료계열=0.60 + 중앙 흰 pill.

const THUMB_SIZE = 100; // 정사각 한 변의 최소값. 약 96~104dp (UI 스펙 §4.2)

/** 찜 버튼을 그릴지, 그린다면 무엇을 보여주고 누르면 뭘 할지. */
export interface FavoriteControl {
  isFavorite: boolean;
  onToggle: () => void;
  /** 요청이 도는 동안 연타를 막는다. */
  disabled?: boolean;
}

interface Props {
  imageUrl: string;
  tradeStatus: string | null;
  productType: string;
  /**
   * 넘기면 썸네일 오른쪽 위에 찜 버튼이 붙는다.
   * 목록에서 바로 찜을 켜고 끄는 화면(홈 · 찜한 상품)만 넘긴다.
   * 판매 · 구매 내역은 관리용 화면이라 넘기지 않는다(설계 §5).
   */
  favorite?: FavoriteControl;
}

export function ProductThumbnail({ imageUrl, tradeStatus, productType, favorite }: Props) {
  // 이미지 로드 실패 시 회색 placeholder로 대체(UI 스펙 §7).
  const [failed, setFailed] = useState(false);
  const overlay = getOverlay(tradeStatus, productType);

  return (
    <View style={styles.container}>
      {!failed && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          onError={() => setFailed(true)}
        />
      )}

      {overlay && (
        <View style={[styles.scrim, { backgroundColor: overlay.scrim }]}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{overlay.label}</Text>
          </View>
        </View>
      )}

      {favorite && (
        // 오버레이(스크림) 위에 오도록 마지막에 그린다.
        // 바깥 카드가 "누르면 상세로"인데, 이 Pressable이 터치를 먼저 받아 상세로 넘어가지 않는다.
        <Pressable
          onPress={favorite.onToggle}
          disabled={favorite.disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: favorite.isFavorite }}
          accessibilityLabel={favorite.isFavorite ? '찜 해제' : '찜하기'}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}
        >
          <IconSymbol
            name={favorite.isFavorite ? 'heart.fill' : 'heart'}
            size={20}
            // 안 찜한 상태는 흰색이다. 사진 위라 회색은 밝은 사진에서 묻힌다(설계 §5).
            color={favorite.isFavorite ? '#FC8181' : '#FFFFFF'}
            style={styles.favoriteIcon}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 높이는 카드 높이만큼 늘어나고(위·아래 꽉 참), 가로는 그 높이를 따라가 항상 정사각을 유지한다.
    alignSelf: 'stretch',
    aspectRatio: 1,
    // 글자 영역이 짧아도 이 크기 아래로는 줄지 않는다.
    minHeight: THUMB_SIZE,
    // 모서리 라운드는 카드가 overflow로 잘라준다(카드 모서리와 어긋나지 않게).
    overflow: 'hidden',
    backgroundColor: '#E5E7EB', // 로드 전/실패 시 보이는 회색 placeholder
  },
  image: {
    // 컨테이너 높이가 카드에 따라 늘어나므로 퍼센트 대신 절대 채움을 쓴다(웹도 absolute 이미지).
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    // 썸네일 전체를 덮는 어두운 막(라운드 안쪽으로).
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // 작은 썸네일이라 좌우 12 / 상하 4로 둠(UI 스펙 §5.3 축소 허용).
    paddingHorizontal: 12,
    paddingVertical: 4,
    // 스크림 위에서 살짝 떠 보이게(약한 그림자 1단계).
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827', // 웹 gray-900
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritePressed: {
    opacity: 0.6,
  },
  favoriteIcon: {
    // 밝은 사진 위에서도 흰 하트가 보이도록 옅은 그림자(웹의 drop-shadow-md에 해당).
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
