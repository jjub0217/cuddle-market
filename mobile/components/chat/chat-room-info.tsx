import { formatPrice } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ChatRoomSummary } from '@/lib/chat/api';
import { productDetailHref } from '@/lib/product-routes';
import { getOverlay } from '@/lib/tradeStatus';

// 채팅방 머리말 — **무슨 상품** 이야기인가(#889).
// 웹 `src/features/chatting-page/components/ChatRoomInfo.tsx` 를 옮긴 것이다.
//
// ⚠️ **상대는 여기서 안 그린다.** 닉네임은 헤더 제목으로 올라갔고, 프로필로 가는 길은
//    ⋮ 메뉴의 「프로필 보기」가 맡는다(#898). 앱은 웹과 달리 헤더가 따로 있어 그 자리가
//    남는데, 두 겹으로 쌓아 두면 대화가 그만큼 짧아진다.
//
// ⚠️ 색은 웹 hex 를 그대로 안 옮긴다. 웹 상품칸 바탕은 `bg-outline-variant/20`(연베이지),
//    가격은 #684d21 인데, 앱은 베이지를 회색으로 모으기로 이미 정해 두었다
//    (constants/colors.ts 의 outline 주석). 모양만 맞추고 색은 앱 토큰을 쓴다.

interface Props {
  room: ChatRoomSummary;
  /**
   * 거래 상태(SELLING · RESERVED · COMPLETED). 주면 썸네일 위에 뱃지를 얹는다.
   * 없으면(아직 상품을 못 받았을 때) 아무것도 안 그린다.
   *
   * ⚠️ 이 값은 **방 정보에 없다.** 상품을 따로 받아야 안다 — 부르는 쪽(`app/chat/[id].tsx`)이
   *    상품 조회 결과를 넘겨준다. 웹도 같은 방식이다(`ChatRoomInfo.tsx` 가 상품을 받아
   *    `ChatProductCard` 에 넘긴다).
   */
  tradeStatus?: string | null;
  /**
   * SELL(판매) 또는 REQUEST(판매요청). COMPLETED 일 때 「판매완료」·「요청완료」를 가른다.
   * 안 주면 판매(SELL)로 친다 — `getTradeLabel` 도 REQUEST 가 아니면 판매로 취급한다.
   */
  productType?: string;
}

export function ChatRoomInfo({ room, tradeStatus, productType }: Props) {
  const router = useRouter();

  // 누를 곳이 없으면 아예 안 그린다 — 눌리는데 아무 일도 안 일어나는 것보다 정직하다.
  // 서버가 아직 상품을 안 실어 보내는 동안도 여기로 온다. 빈 띠를 남기지 않는다.
  if (room.productId == null) return null;

  // ⚠️ 채팅방은 **루트 화면**이라 어느 탭에서 열렸는지 모른다(알림에서 바로 들어오기도 한다).
  //    그래서 홈 스택에 쌓는다 — 상품 목록이 미는 자리와 같다. 그룹을 안 적으면
  //    expo-router 가 알아서 홈으로 옮겨간 뒤 쌓아 뒤로가기가 어긋난다.
  const openProduct = () => {
    router.push(productDetailHref('home', room.productId as number) as Href);
  };

  // 그릴지 말지·무슨 색인지는 `lib/tradeStatus.ts` 의 `getOverlay` 하나가 정한다 — 목록 썸네일
  // (`product-thumbnail.tsx`)·상세 사진(`image-carousel.tsx`)과 같은 규칙이다.
  // 판매중·요청중이면 null 이라 아무것도 안 그린다. 웹도 그렇다.
  const overlay = getOverlay(tradeStatus ?? null, productType ?? 'SELL');

  return (
    <View style={styles.container}>
      <Pressable
        onPress={openProduct}
        accessibilityRole="button"
        accessibilityLabel={`${room.productTitle ?? '상품'} 상세 보기`}
        style={({ pressed }) => [styles.product, pressed && styles.pressed]}
      >
        <View style={styles.thumb}>
          {room.productImageUrl ? (
            <Image
              source={{ uri: room.productImageUrl }}
              style={styles.thumbImage}
              contentFit="cover"
            />
          ) : null}
          {overlay ? (
            <View style={[styles.scrim, { backgroundColor: overlay.scrim }]}>
              <Text style={styles.badge} numberOfLines={1}>
                {overlay.label}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.productBody}>
          {room.productTitle ? (
            <Text style={styles.productTitle} numberOfLines={1}>
              {room.productTitle}
            </Text>
          ) : null}
          {/* 웹은 값이 없으면 빈 글자를 그린다. 앱은 줄 자체를 안 그린다 — 같은 결과다 */}
          {room.productPrice != null ? (
            <Text style={styles.productPrice}>{`${formatPrice(room.productPrice)}원`}</Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 웹 p-3.5(14) 그대로다. 상대 줄이 빠져 안에 든 것이 하나뿐이라 gap 은 없앴다.
  container: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  pressed: { opacity: 0.6 },
  // 웹 rounded-2xl(16) · px-2.5(10) · py-3(12) · gap-2(8)
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceSunken,
  },
  // 웹 size="md" 는 w-16(64) 인데 앱은 48로 줄였다 — 폰 화면에서는 64가 대화보다 무겁다
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    // 사진이 없거나 아직 안 왔을 때 보이는 자리. 목록의 썸네일과 같은 회색이다
    backgroundColor: colors.outlineVariant,
  },
  thumbImage: { width: '100%', height: '100%' },
  // 썸네일 전체를 덮는 어두운 막. 색은 `getOverlay` 가 준다(예약중 0.40 · 완료 0.60).
  scrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 흰 알약. 모양(둥근 모서리·흰 바탕·굵은 글씨)은 목록 썸네일(`product-thumbnail.tsx` 의
  // `pill`)·웹(`ChatProductCard.tsx` 의 `BADGE_CLASSNAME`)과 같고 **치수만 다시 잡았다.**
  //
  // ⚠️ **여기 썸네일은 48 이다.** 목록 썸네일의 알약 치수(글자 11 · 좌우 12 · 상하 4)는
  //    100 기준이라 그대로 쓰면 「판매완료」 넉 자가 48 을 넘어 잘린다 — 어림잡아
  //    11×4 + 24 = 68 로 상자보다 크다. 웹 채팅방 카드도 64 기준이라(글자 10 · 좌우 6)
  //    그대로는 못 쓴다.
  //    그래서 글자 9 · 좌우 4 · 상하 1 로 줄였다. 한글은 한 자가 대략 글자 크기의 0.9배라
  //    9×4 + 8 ≈ 44 로 48 안에 들어온다(좌우로 2씩 남는다).
  //    ⚠️ **이 44 는 계산이지 실측이 아니다.** 폰 글꼴은 맥과 달라서 실기기(Expo Go)로
  //    「판매완료」가 안 잘리는지 눈으로 봐야 한다. 넘치면 글자를 8 로 한 단 더 줄인다.
  //    (`numberOfLines={1}` 을 둔 것은 그래도 두 줄로 접히지 않게 하려는 안전장치다.)
  badge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurface,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 1,
    // ⚠️ 안드로이드는 이게 없으면 `<Text>` 의 둥근 모서리가 안 깎인다(날짜 알약도 같다).
    overflow: 'hidden',
  },
  productBody: { flex: 1, gap: 2 },
  // 웹 text-sm font-medium
  productTitle: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  // 웹은 #684d21(브랜드 갈색)이다. 앱에서 같은 자리의 토큰은 brandText 다
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.brandText },
});
