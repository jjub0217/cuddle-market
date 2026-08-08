import { formatJoinDate } from '@cuddle/shared';
import { Image } from 'expo-image';
import { ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
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
  // 웹과 **같은 함수**를 쓴다. 웹 ProfileData 안에 갇혀 있던 것을 packages/shared 로 옮겼다
  const 가입일 = formatJoinDate(profile.createdAt);

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
          {/* ⚠️ **지역 바로 밑이다. 소개글 뒤가 아니다.** 소개글 뒤에 두면 붕 뜬다 —
              소개글은 「그 사람이 쓴 말」이고 가입일은 「계정에 대한 사실」이라 성격이 다른데,
              비슷한 회색 글자가 이어지니 소개글의 둘째 문단처럼 읽히다가 아닌 걸 알게 된다.
              **가입일은 지역과 같은 종류**라 거기 붙어야 눈에 자연스럽다. 웹도 같은 자리다.
              ⚠️ 날짜로 그린다. 「2년 전」은 1년 7개월도 2년 11개월도 된다 — 거래 상대를
                 가늠하는 자리에서 뭉뚱그리면 안 좋다. getTimeAgo 를 쓰는 곳
                 (게시글·댓글·알림)은 「방금 것인가」가 중요한 값이라 성격이 다르다.
              ⚠️ 값이 없으면 줄 자체를 안 그린다 — 빈 줄은 「고장났나」로 보인다 */}
          {가입일 ? <Text style={styles.joinDate}>{가입일} 가입</Text> : null}
        </View>
      </View>

      {/*
        ⚠️ **사진 아래, 전체 폭이다.** 웹과 같은 자리다(ProfileData 에서 소개글은 사진 줄의
           형제다). 예전에는 주소 밑(사진 옆 열 안)에 뒀고, 그때 주석은 이렇게 적혀 있었다 —
           「닉네임·주소와 한 묶음이라 눈이 한 번에 읽힌다. 사진 아래로 떨어뜨리면 사진과
           글이 따로 노는 카드가 된다」.

        **뒤집은 이유 둘.**
        ① **폭.** 열 안에 두면 매 줄 68을 잃는다(사진 56 + 사이 12). 360 폰에서 328 → 260,
           21% 손해다. 소개글은 200자까지 쓸 수 있어 여러 줄이 되기 쉬운 글이다.
        ② **성격이 다르다.** 사진 옆 열은 닉네임·지역·가입일 — 전부 「이 사람에 대한 사실」이다.
           소개글은 「그 사람이 쓴 말」이라 거기 섞이면 안 된다(가입일을 지역 밑으로 올린 것과
           같은 기준이다).
        옛 걱정(「따로 논다」)은 오른쪽이 **두 줄뿐이라 사진보다 짧았을 때**의 판단이다.
        가입일이 생겨 세 줄(≈68)이 되면서 이미 사진(56)보다 길어졌다.

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
        style={[styles.introduction, !profile.introduction?.trim() && styles.introductionEmpty]}
      >
        {profile.introduction?.trim() || '소개글이 없습니다'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.surface,
  },
  // ⚠️ flex-start 다. 가운데 정렬이면 오른쪽 글자 줄 수가 늘 때마다(가입일이 생겼다)
  //    사진이 아래로 밀려 닉네임과 눈높이가 안 맞는다
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // 판매자 카드와 같은 크림색. 회색은 에러처럼 보인다는 피드백이 있었다.
    backgroundColor: colors.brandSurface,
  },
  avatarImage: { width: '100%', height: '100%' },
  // ⚠️ 웹과 같은 색이다(#825500). 마이 화면·프로필 수정과도 같아야 한다
  avatarInitial: { fontSize: 22, fontWeight: '700', color: colors.accent },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    // 웹 bg-red-100 / text-red-600과 같은 결
    backgroundColor: colors.dangerSurface,
  },
  blockedLabel: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  location: { fontSize: 13, color: colors.onSurfaceMuted },
  // ⚠️ **선도 이름표도 없다.** 처음엔 「가입일 ↔ 2023.04.12」에 구분선을 그었는데,
  //    그건 설정 화면처럼 값이 여럿 나열될 때 쓰는 짜임이라 한 줄만 있으면 떠 보였다.
  //    「가입」이라는 말꼬리가 붙어 있어 이름표도 따로 필요 없다.
  // ⚠️ **자기 줄을 갖는다.** 지역 줄에 「서울 은평구 · 2023.04.12 가입」으로 이어 붙이면
  //    가장 긴 지역명(제주특별자치도 서귀포시)에서 좁은 폰과 웹 옆 칸(288px)이 넘친다.
  // 지역 줄과 **같은 값**이다. 둘 다 「이 사람에 대한 사실」이라 한 덩어리로 읽혀야 한다.
  // 웹도 같은 결이다(text-[13px] text-gray-500)
  joinDate: { fontSize: 13, color: colors.onSurfaceMuted },
  // 여백을 따로 안 준다 — 이제 container 의 형제라 container 의 gap(12)이 알아서 띄운다.
  // (열 안에 있을 때는 info 의 gap 이 4라 marginTop 으로 더 벌려야 했다)
  introduction: { fontSize: 14, color: colors.onSurfaceMedium, lineHeight: 20 },
  // 값이 아니라 「없다」는 안내라는 게 보이게 옅게
  introductionEmpty: { color: colors.onSurfaceSubtle },
});
