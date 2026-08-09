import type { SellerInfo } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useMe } from '@/hooks/use-me';
import { useAuthStore } from '@/lib/auth/store';

// 판매자 프로필. 웹과 같은 위치(설명보다 위).
// 프로필 이미지가 없으면(실측 null 가능) 닉네임 첫 글자를 동그라미에 넣는다.
//
// 누르면 판매자 프로필로 간다(#805).
//
// 게스트면 프로필 대신 로그인 화면을 띄운다. 서버에 @PreAuthorize가 걸려 있어
// 게스트가 열면 401만 받고 빈 화면을 보게 된다. 마이 탭이 쓰는 방식과 같다 —
// 「들어간 뒤 밀어내기」가 아니라 「들어가기 전에 막기」라야 취소했을 때 제자리로 돌아온다.

interface Props {
  seller: SellerInfo;
}

export function SellerCard({ seller }: Props) {
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  // string[]으로 넓히는 이유: useSegments()는 「있을 수 있는 경로들」의 튜플 유니온을
  // 돌려주는데, 그러면 공통 원소 타입이 never라 includes()에 무엇도 넣을 수 없다.
  const segments = useSegments() as string[];
  const isAuthed = useAuthStore((state) => state.status) === 'authed';
  const { data: me } = useMe();
  const location = [seller.addressSido, seller.addressGugun].filter(Boolean).join(' ');
  const showImage = Boolean(seller.sellerProfileImageUrl) && !failed;

  const open = () => {
    if (!isAuthed) {
      router.push('/login');
      return;
    }

    // ⚠️ **내 프로필이면 마이 탭으로 보낸다.** users/[id] 는 남의 프로필을 보는 자리다 —
    //    내 id 로 들어가면 「내 상품 관리」도 없는 반쪽 화면이 뜬다. 웹도 같은 규칙이다
    //    (SellerProfileCard 가 내 id 면 마이페이지로 보낸다) (#869).
    if (me && seller.sellerId === me.id) {
      router.push('/(tabs)/(my)');
      return;
    }

    // 지금 어느 탭 스택에 있는지 보고 그 스택에 쌓는다.
    // 그룹을 안 적으면 expo-router가 홈 탭으로 옮겨간 뒤 거기에 쌓아서, 찜 목록에서
    // 들어왔을 때 뒤로 가면 원래 자리가 아니라 홈이 나온다(products/[id]와 같은 함정).
    const group = segments.includes('(my)') ? '(my)' : '(home)';
    router.push(`/(tabs)/${group}/users/${seller.sellerId}`);
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${seller.sellerNickname} 프로필 보기`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.avatar}>
        {showImage ? (
          <Image
            source={{ uri: seller.sellerProfileImageUrl as string }}
            style={styles.avatarImage}
            contentFit="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={styles.avatarInitial}>
            {seller.sellerNickname.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nickname}>{seller.sellerNickname}</Text>
        {location ? <Text style={styles.location}>{location}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowPressed: {
    opacity: 0.6,
  },
  // 프로필 이미지가 없을 때만 보이는 자리표시자.
  // 웹 상세 아바타(bg-primary-50)와 같은 디자인 시스템 색(크림/베이지)으로 맞춘다.
  // (회색은 에러처럼 보인다는 피드백으로 브랜드 크림으로 되돌림.)
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSurface,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    // 웹이 기본 텍스트색(검정)을 상속하는 것과 같은 결. 크림 배경 위 대비 넉넉.
    color: colors.onSurface,
  },
  info: {
    gap: 3,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.onSurface,
  },
  location: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
});
