import { formatPrice } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ChatRoomSummary } from '@/lib/chat/api';
import { productDetailHref } from '@/lib/product-routes';

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
}

export function ChatRoomInfo({ room }: Props) {
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
  productBody: { flex: 1, gap: 2 },
  // 웹 text-sm font-medium
  productTitle: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  // 웹은 #684d21(브랜드 갈색)이다. 앱에서 같은 자리의 토큰은 brandText 다
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.brandText },
});
