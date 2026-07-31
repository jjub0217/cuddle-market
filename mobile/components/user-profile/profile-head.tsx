import { Image } from 'expo-image';
import { ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { UserProfile } from '@/lib/user-profile';

// 프로필 위쪽 — 사진 · 닉네임 · 지역 · 소개글.
// 웹 ProfileData(모바일 폭)와 같은 구성이다.

interface Props {
  profile: UserProfile;
}

export function ProfileHead({ profile }: Props) {
  const [failed, setFailed] = useState(false);
  const location = [profile.addressSido, profile.addressGugun].filter(Boolean).join(' ');
  const showImage = Boolean(profile.profileImageUrl) && !failed;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {showImage ? (
            <Image
              source={{ uri: profile.profileImageUrl as string }}
              style={styles.avatarImage}
              contentFit="cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <Text style={styles.avatarInitial}>{profile.nickname.charAt(0).toUpperCase()}</Text>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            {/* 웹 ProfileData와 같은 배지 */}
            {profile.isBlocked ? (
              <View style={styles.blockedBadge}>
                <ShieldAlert size={12} color="#DC2626" />
                <Text style={styles.blockedLabel}>차단 유저</Text>
              </View>
            ) : null}
          </View>
          {location ? <Text style={styles.location}>{location}</Text> : null}
        </View>
      </View>

      {/* 소개글이 없으면 줄을 아예 안 그린다.
          웹은 남의 프로필에서도 「소개글을 작성해주세요」가 뜨는데(#810), 남에게
          작성하라고 할 이유가 없다. 앱은 처음부터 안 그런다. */}
      {profile.introduction ? (
        <Text style={styles.introduction}>{profile.introduction}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // 판매자 카드와 같은 크림색. 회색은 에러처럼 보인다는 피드백이 있었다.
    backgroundColor: '#FAF3E6',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 22, color: '#111827' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 18, fontWeight: '700', color: '#111827' },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    // 웹 bg-red-100 / text-red-600과 같은 결
    backgroundColor: '#FEE2E2',
  },
  blockedLabel: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  location: { fontSize: 13, color: '#6B7280' },
  introduction: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});
