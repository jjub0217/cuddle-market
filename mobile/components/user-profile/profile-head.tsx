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
          {/*
            ⚠️ **주소 바로 밑에 둔다.** 닉네임·주소와 한 묶음이라 눈이 위에서 아래로 한 번에
               읽힌다. 사진 아래로 떨어뜨리면 사진과 글이 따로 노는 카드가 된다.

            소개글이 없으면 **「소개글이 없습니다」**를 그린다.
            ⚠️ **「소개글을 작성해주세요」가 아니다.** 남의 프로필에서 그러면 누구더러 쓰라는
               건지 알 수 없다(#810에서 웹이 그랬고, 그래서 앱은 아예 안 그렸다).
               「없습니다」는 **사실을 적는 것**이라 그 문제가 없고, 빈 자리도 덜 허전하다.
               내 프로필(마이 화면 계정 카드)에서는 반대로 「작성해주세요」다 — 거기서는
               그 자리가 곧 쓰러 가는 길이다.

            공백만 있는 소개글도 「없다」로 본다 — 웹은 저장할 때 앞뒤 공백을 안 떼고 최소
            2자만 봐서 공백 두 칸도 저장된다.
          */}
          <Text
            style={[
              styles.introduction,
              !profile.introduction?.trim() && styles.introductionEmpty,
            ]}
          >
            {profile.introduction?.trim() || '소개글이 없습니다'}
          </Text>
        </View>
      </View>

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
  // ⚠️ 웹과 같은 색이다(#825500). 마이 화면·프로필 수정과도 같아야 한다
  avatarInitial: { fontSize: 22, fontWeight: '700', color: '#825500' },
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
  // 값이 아니라 「없다」는 안내라는 게 보이게 옅게
  introductionEmpty: { color: '#9CA3AF' },
});
