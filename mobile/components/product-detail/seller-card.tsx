import type { SellerInfo } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// 판매자 프로필. 웹과 같은 위치(설명보다 위).
// 프로필 이미지가 없으면(실측 null 가능) 닉네임 첫 글자를 동그라미에 넣는다.
// 프로필로 이동하는 동작은 로그인이 있어야 해서 이번 바퀴에는 없다.

interface Props {
  seller: SellerInfo;
}

export function SellerCard({ seller }: Props) {
  const [failed, setFailed] = useState(false);
  const location = [seller.addressSido, seller.addressGugun].filter(Boolean).join(' ');
  const showImage = Boolean(seller.sellerProfileImageUrl) && !failed;

  return (
    <View style={styles.row}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    backgroundColor: '#FAF3E6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    // 웹이 기본 텍스트색(검정)을 상속하는 것과 같은 결. 크림 배경 위 대비 넉넉.
    color: '#111827',
  },
  info: {
    gap: 3,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
  },
});
