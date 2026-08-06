import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronRight, Handbag, Headphones, Heart, LogOut, Tag, UserMinus, UserX } from 'lucide-react-native';

import { LogoutModal } from '@/components/my/logout-modal';
import { SectionCard, SectionRow } from '@/components/my/section-card';
import { WithdrawModal } from '@/components/my/withdraw-modal';
import { AppHeader } from '@/components/ui/app-header';
import { useMe } from '@/hooks/use-me';
import { useAuthStore } from '@/lib/auth/store';
import { ACCOUNT_DELETION_URL, PRIVACY_URL, SUPPORT_MAIL_URL } from '@/lib/support-links';

// 마이페이지. 웹 모바일 마이페이지와 같은 카드 결.
//
// 「내 상품 관리」·「찜한 상품」 메뉴는 아직 넣지 않는다 —
// 눌러도 갈 화면이 없어서 "준비 중" 같은 군더더기가 생긴다. 다음 바퀴에 화면과 함께 넣는다.
//
// 「고객지원」 묶음은 헤더 햄버거에도 있고 여기에도 있다 — 일부러 중복이다.
// 웹이 푸터와 모바일 내비 양쪽에 두고 있어 그것을 따랐다. 찾는 사람이 어느 쪽으로
// 가든 닿아야 한다.
//
// 한때 여기서 지우고 햄버거로만 뒀는데(#806), 웹이 중복인데 앱만 한 곳으로 몰 이유가
// 없어 되살렸다. 주소·메일 상수는 lib/support-links.ts에 있어 두 화면이 같이 쓴다.

export default function MyScreen() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const { data: me, isLoading } = useMe();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // 게스트가 마이 탭에 남아 있을 이유가 없다. 홈으로 보낸다.
  //
  // 왜 '/'가 아니라 '/(tabs)/(home)'인가:
  // (home)과 (my)는 둘 다 그룹이라 주소에 안 나타나고, 둘 다 index를 갖고 있어서
  // 두 화면의 주소가 똑같이 '/'다(.expo/types/router.d.ts에서 확인). 그래서 마이에서
  // '/'로 가라고 하면 지금 있는 자리를 가리키게 되어 아무 일도 일어나지 않는다.
  // 홈을 콕 집으려면 그룹 이름까지 적어야 한다. 실기기에서 두 번 헛돈 자리다.
  const goHome = () => router.navigate('/(tabs)/(home)');

  const renderBody = () => {
    // 게스트인데 이 화면이 열려 있는 건 정상 흐름이 아니다(탭 누름을 가로채므로).
    // 로그아웃 직후처럼 잠깐 스쳐 갈 때를 위한 안전망.
    if (status === 'guest') {
      return (
        <View style={styles.center}>
          <Text style={styles.centerText}>로그인이 필요합니다.</Text>
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          >
            <Text style={styles.loginButtonLabel}>로그인하기</Text>
          </Pressable>
        </View>
      );
    }

    if (status === 'restoring' || isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      );
    }

    const location = [me?.addressSido, me?.addressGugun].filter(Boolean).join(' ');

    return (
      <ScrollView contentContainerStyle={styles.content}>
        {/*
          계정 카드를 누르면 프로필 수정으로 간다. **웹도 여기가 유일한 길이다**
          (`ProfileData.tsx:382` — 카드 안의 「프로필 수정」 단추).
          웹은 단추지만 앱은 오른쪽에 `〉` 를 붙인다 — 아래 줄들(판매 내역·찜한 상품 …)이
          다 그 모양이라, 같은 방식이어야 「누르면 들어간다」가 앱 안에서 한 모양이 된다.
        */}
        <Pressable
          testID="profile-card"
          onPress={() => router.push('/profile-edit')}
          accessibilityRole="button"
          accessibilityLabel="프로필 수정"
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        >
          <View style={styles.avatar}>
            {me?.profileImageUrl ? (
              <Image
                source={{ uri: me.profileImageUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {(me?.nickname ?? '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.nickname}>{me?.nickname ?? ''}</Text>
            {location ? <Text style={styles.location}>{location}</Text> : null}
            {/*
              ⚠️ **내 소개글은 없어도 자리를 보여준다.** 웹도 그렇다
                 (`ProfileData.tsx:342` — `introduction || isMyProfile`).
                 남의 프로필에서는 「작성해주세요」가 누구더러 쓰라는 건지 알 수 없어
                 아예 안 그리지만(`user-profile/profile-head.tsx:54`), 내 프로필에서는
                 그게 **쓰러 가는 길**이 된다 — 눌러서 프로필 수정으로 간다.

              공백만 있는 소개글도 「없다」로 본다.
            */}
            <Text
              style={[styles.introduction, !me?.introduction?.trim() && styles.introductionEmpty]}
              numberOfLines={2}
            >
              {me?.introduction?.trim() || '소개글을 작성해주세요'}
            </Text>
          </View>
          {/* 아래 줄들과 같은 화살표다(components/my/section-card.tsx:59) */}
          <ChevronRight size={22} color="#9CA3AF" />
        </Pressable>

        {/* 웹 모바일 마이페이지와 같은 묶음·이름. 웹은 「구매내역」으로 붙여 썼는데
            나머지 둘은 띄어써서, 여기서는 띄어쓰고 웹 표기도 함께 고친다. */}
        {/* 줄 왼쪽 아이콘은 웹 모바일 마이페이지(MyPage.tsx의 md:hidden 블록)와 같은 것이다. */}
        <SectionCard title="내 상품 관리">
          <SectionRow icon={Tag} label="판매 내역" onPress={() => router.push('/(tabs)/(my)/my-products')} />
          <SectionRow icon={Handbag} label="구매 내역" onPress={() => router.push('/(tabs)/(my)/my-purchases')} />
          <SectionRow icon={Heart} label="찜한 상품" onPress={() => router.push('/(tabs)/(my)/my-favorites')} />
        </SectionCard>

        <SectionCard title="고객지원">
          <SectionRow icon={Headphones} label="고객센터" onPress={() => Linking.openURL(SUPPORT_MAIL_URL)} />
          {/* 아래 둘은 웹 마이페이지에 없는 줄이라(웹은 푸터·햄버거에 둔다) 가져올
              아이콘이 없다. 지어내지 않고 비워 둔다. */}
          <SectionRow label="개인정보처리방침" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <SectionRow label="계정 삭제 안내" onPress={() => Linking.openURL(ACCOUNT_DELETION_URL)} />
        </SectionCard>

        <SectionCard title="계정">
          <SectionRow
            icon={UserX}
            label="차단 목록"
            onPress={() => router.push('/(tabs)/(my)/blocked-users')}
          />
          <SectionRow icon={LogOut} label="로그아웃" onPress={() => setIsLogoutOpen(true)} />
          <SectionRow icon={UserMinus} label="탈퇴하기" tone="danger" onPress={() => setIsWithdrawOpen(true)} />
        </SectionCard>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 손으로 만들었던 「마이」 헤더를 공용 조각으로 바꿨다(#806). */}
      <AppHeader left="마이" />
      {renderBody()}
      <LogoutModal
        visible={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onDone={() => {
          setIsLogoutOpen(false);
          goHome();
        }}
      />
      <WithdrawModal
        visible={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onDone={() => {
          setIsWithdrawOpen(false);
          goHome();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  loginButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
  profileCard: {
    flexDirection: 'row',
    // ⚠️ **위쪽 정렬이다.** 가운데로 두면 소개글이 들어가 카드가 길어질 때 화살표가
    //    한가운데로 내려앉는다. 웹도 위쪽이다(`MyPage.tsx` 의 `items-start`).
    alignItems: 'flex-start',
    // 글자 묶음이 남는 자리를 다 먹어야 화살표가 오른쪽 끝에 붙는다
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B7280',
  },
  profileText: {
    // 남는 자리를 다 먹어 화살표를 오른쪽 끝으로 민다
    flex: 1,
    gap: 4,
  },
  introduction: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  // 아직 안 쓴 자리는 옅게 — 값이 아니라 안내라는 게 보여야 한다
  introductionEmpty: {
    color: '#9CA3AF',
  },
  nickname: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
  },
});
