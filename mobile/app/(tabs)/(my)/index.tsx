import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoutModal } from '@/components/my/logout-modal';
import { SectionCard, SectionRow } from '@/components/my/section-card';
import { WithdrawModal } from '@/components/my/withdraw-modal';
import { AppHeader } from '@/components/ui/app-header';
import { useMe } from '@/hooks/use-me';
import { useAuthStore } from '@/lib/auth/store';

// 마이페이지. 웹 모바일 마이페이지와 같은 카드 결.
//
// 「내 상품 관리」·「찜한 상품」 메뉴는 아직 넣지 않는다 —
// 눌러도 갈 화면이 없어서 "준비 중" 같은 군더더기가 생긴다. 다음 바퀴에 화면과 함께 넣는다.
//
// 「고객지원」 묶음(고객센터·개인정보처리방침)은 헤더 햄버거로 옮겼다(#806).
// 로그인 없이도 닿아야 하는 것은 햄버거, 로그인해야 의미 있는 것은 마이 — 가 기준인데
// 이 화면은 로그인해야 열려서, 여기 두면 로그아웃한 사람은 방침에 닿을 길이 없었다.
// 주소·메일 상수도 lib/support-links.ts로 옮겼다.

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
        <View style={styles.profileCard}>
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
          </View>
        </View>

        {/* 웹 모바일 마이페이지와 같은 묶음·이름. 웹은 「구매내역」으로 붙여 썼는데
            나머지 둘은 띄어써서, 여기서는 띄어쓰고 웹 표기도 함께 고친다. */}
        <SectionCard title="내 상품 관리">
          <SectionRow label="판매 내역" onPress={() => router.push('/(tabs)/(my)/my-products')} />
          <SectionRow label="구매 내역" onPress={() => router.push('/(tabs)/(my)/my-purchases')} />
          <SectionRow label="찜한 상품" onPress={() => router.push('/(tabs)/(my)/my-favorites')} />
        </SectionCard>

        <SectionCard title="계정">
          <SectionRow label="로그아웃" onPress={() => setIsLogoutOpen(true)} />
          <SectionRow label="탈퇴하기" tone="danger" onPress={() => setIsWithdrawOpen(true)} />
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
    alignItems: 'center',
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
    gap: 4,
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
