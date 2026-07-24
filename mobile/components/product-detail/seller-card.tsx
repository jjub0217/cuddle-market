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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    color: '#EA580C',
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
