import { formatPrice } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ChatRoomSummary } from '@/lib/chat/api';
import { productDetailHref } from '@/lib/product-routes';

// 채팅방 머리말 — **누구와 무슨 상품** 이야기인가(#889).
// 웹 `src/features/chatting-page/components/ChatRoomInfo.tsx` 를 옮긴 것이다.
//
// 웹과 다른 곳 둘:
//   ⋮ 메뉴가 없다   앱은 「나가기」가 이미 ScreenHeader 오른쪽에 있다(판매완료·신고·차단은 아직 없다)
//   뒤로가 없다      같은 이유로 ScreenHeader 가 맡는다
//
// ⚠️ 색은 웹 hex 를 그대로 안 옮긴다. 웹 상품칸 바탕은 `bg-outline-variant/20`(연베이지),
//    가격은 #684d21 인데, 앱은 베이지를 회색으로 모으기로 이미 정해 두었다
//    (constants/colors.ts 의 outline 주석). 모양만 맞추고 색은 앱 토큰을 쓴다.

interface Props {
  room: ChatRoomSummary;
}

export function ChatRoomInfo({ room }: Props) {
  const router = useRouter();
  const [avatarFailed, setAvatarFailed] = useState(false);

  // 상대가 회원 탈퇴하면 opponentId 가 없다. 이름(「알 수 없는 사용자」)과 기본 프로필은
  // 그대로 보여주되 **프로필로 가는 길을 안 만든다** — 웹과 같다(ChatRoomInfo.tsx:154).
  //
  // ⚠️ 「방을 나간」 것과는 다르다. 나간 상대는 opponentId 가 그대로 있다.
  const hasOpponent = room.opponentId != null;
  const nickname = room.opponentNickname;
  const showOpponent = nickname != null && nickname !== '';
  // 누를 곳이 없으면 상품칸을 안 그린다 — 눌리는데 아무 일도 안 일어나는 것보다 정직하다.
  const showProduct = room.productId != null;

  // 서버가 아직 안 실어 보내는 동안이다. 빈 띠를 남기지 않고 통째로 비운다.
  if (!showOpponent && !showProduct) return null;

  // ⚠️ 채팅방은 **루트 화면**이라 어느 탭에서 열렸는지 모른다(알림에서 바로 들어오기도 한다).
  //    그래서 홈 스택에 쌓는다 — 상품 목록이 미는 자리와 같다. 그룹을 안 적으면
  //    expo-router 가 알아서 홈으로 옮겨간 뒤 쌓아 뒤로가기가 어긋난다.
  const openProduct = () => {
    router.push(productDetailHref('home', room.productId as number) as Href);
  };

  const openProfile = () => {
    router.push(`/(tabs)/(home)/users/${room.opponentId}` as Href);
  };

  const showAvatarImage = Boolean(room.opponentProfileImageUrl) && !avatarFailed;
  const avatar = (
    <View style={styles.avatar}>
      {showAvatarImage ? (
        <Image
          source={{ uri: room.opponentProfileImageUrl as string }}
          style={styles.avatarImage}
          contentFit="cover"
          onError={() => setAvatarFailed(true)}
        />
      ) : (
        <Text style={styles.avatarInitial}>{(nickname ?? '?').charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
  const nicknameText = (
    <Text style={styles.nickname} numberOfLines={1}>
      {nickname}
    </Text>
  );

  return (
    <View style={styles.container}>
      {showOpponent ? (
        hasOpponent ? (
          <Pressable
            onPress={openProfile}
            accessibilityRole="button"
            accessibilityLabel={`${nickname} 프로필 보기`}
            style={({ pressed }) => [styles.opponent, pressed && styles.pressed]}
          >
            {avatar}
            {nicknameText}
          </Pressable>
        ) : (
          <View style={styles.opponent}>
            {avatar}
            {nicknameText}
          </View>
        )
      ) : null}

      {showProduct ? (
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 웹 p-3.5(14) · gap-2.5(10) 그대로다. 아래 선은 웹에서 이 조각을 감싼 틀이 긋는다
  // (ChattingPage.tsx 의 border-b border-outline-variant/60).
  container: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  pressed: { opacity: 0.6 },
  // 웹 gap-2(8) · 아바타 md(40)
  opponent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // 사진이 없을 때만 보인다. 판매자 카드(seller-card)와 같은 크림 바탕이다 —
    // 회색은 「깨진 사진」처럼 보인다는 이야기를 이미 들었다.
    backgroundColor: colors.brandSurface,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 16, color: colors.onSurface },
  // 웹 font-semibold
  nickname: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.onSurface },
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
  // 웹 size="md" 는 w-16(64) 정사각이다
  thumb: {
    width: 64,
    height: 64,
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
