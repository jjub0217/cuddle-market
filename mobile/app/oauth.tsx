import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { needsSocialSignup } from '@cuddle/shared';

import { completeSocialLogin } from '@/lib/auth/social';
import { fetchMe } from '@/lib/profile';
import { showToast } from '@/lib/toast';

// 소셜 로그인이 끝나고 브라우저가 돌려보내는 자리.
//
//   성공  cuddlemarket://oauth?accessToken=…&refreshToken=…
//   실패  cuddlemarket://oauth?error=…
//
// ⚠️ 왜 화면이 필요한가: `openAuthSessionAsync`가 그 주소를 가로채 줄 거라 봤는데,
//    실기기(갤럭시·개발 빌드)에서는 **안드로이드가 딥링크를 앱에 바로 던졌다.**
//    받을 화면이 없어 expo-router가 「Unmatched Route」를 띄우고 로그인이 거기서 끊겼다
//    (2026-08-04 실기기). 가로채기가 되는 기기도 있으므로 두 길을 다 열어 둔다.
//
// 이 화면은 잠깐 지나가는 자리다. 동그라미만 돌리고 곧 다른 화면으로 넘긴다.

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { accessToken, refreshToken, error } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }>();

  // ⚠️ 한 번만 돈다. 이 안에서 router를 부르면 화면이 다시 그려지는데,
  //    그때 또 들어오면 토큰을 두 번 저장하고 화면도 두 번 넘어간다.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      // 가로채기가 안 된 경우 브라우저 창이 뒤에 남아 있다. 닫아 준다.
      // (이미 닫혔으면 아무 일도 안 한다)
      try {
        WebBrowser.dismissBrowser();
      } catch {
        // 창이 없으면 여기서 던질 수 있다. 로그인과 무관하니 삼킨다.
      }

      // 서버가 실패를 알려 온 경우. 사용자가 카카오에서 취소한 것도 여기로 온다.
      if (error) {
        showToast('로그인에 실패했습니다. 다시 시도해주세요.');
        router.replace('/login');
        return;
      }

      // ⚠️ 토큰이 하나만 오면 못 쓴다 — 리프레시가 없으면 만료 뒤 되살릴 방법이 없다.
      if (!accessToken || !refreshToken) {
        showToast('로그인에 실패했습니다. 다시 시도해주세요.');
        router.replace('/login');
        return;
      }

      await completeSocialLogin(accessToken, refreshToken);

      try {
        const me = await fetchMe();
        if (needsSocialSignup(me)) {
          router.replace('/social-signup');
          return;
        }
      } catch {
        // 프로필을 못 읽어도 **로그인은 이미 됐다.** 여기서 로그아웃시키면
        // 방금 성공한 로그인을 되돌리는 셈이다. 알리고 그냥 보낸다.
        showToast('내 정보를 불러오지 못했어요. 마이에서 다시 확인해주세요.');
      }

      // 로그인 관문까지 함께 닫고 원래 보던 자리로. 못 닫으면 홈으로 떨어뜨린다.
      if (router.canDismiss()) {
        router.dismissAll();
        return;
      }
      router.replace('/(tabs)/(home)');
    };

    void run();
  }, [accessToken, refreshToken, error, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#111827" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
