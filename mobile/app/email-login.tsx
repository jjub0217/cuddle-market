import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { LoginForm } from '@/components/auth/login-form';

// 이메일로 로그인하기. 로그인 관문(login.tsx)에서 「이메일로 로그인」을 누르면 온다.
//
// 왜 화면을 둘로 나눴나 (3바퀴에 합의, 2026-07-28 설계 §8.1):
//   · 소셜 단추가 앞으로 셋이 될 수 있다 — 애플 심사 규정 4.8상 다른 소셜을 제공하면
//     「Apple로 로그인」도 넣어야 한다. 한 화면에 다 놓으면 요소가 여덟 개가 된다
//   · 폰에서 키보드가 화면의 40~50%를 덮는다. 이메일 칸을 누르는 순간 소셜 단추와
//     회원가입 링크가 가려져, 마음을 바꾸려면 키보드를 내리고 스크롤해야 한다
//   · 자동 로그인이 있어 이 화면은 토큰이 완전히 만료됐을 때만 본다 — +1탭 비용이 작다
//
// 데스크탑 웹은 1단계 그대로다(세로 공간이 넉넉하고 키보드가 화면을 안 덮는다).

export default function EmailLoginScreen() {
  const router = useRouter();

  /**
   * 로그인에 성공하면 **관문까지 함께 닫고** 원래 보던 자리로 돌아간다.
   *
   * ⚠️ back() 한 번이면 관문이 다시 보인다 — 방금 로그인했는데 로그인 화면이 나오는 꼴이다.
   *    루트 스택은 [(tabs), login, email-login]이라 dismissAll()이 (tabs)까지 되돌린다.
   *    탭 안에서 보던 화면(상품 상세 등)은 그 스택에 그대로 남아 있어 자리를 안 잃는다.
   */
  const close = () => {
    if (router.canDismiss()) {
      router.dismissAll();
      return;
    }
    // 딥링크로 이 화면부터 열린 경우엔 되돌아갈 자리가 없다.
    router.replace('/(tabs)/(home)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더는 화면 이름, 본문은 지금 할 일(LoginForm 의 「이메일로 로그인하기」).
          관문(login.tsx)과 헤더 이름이 같은 것은 가입과 같은 결이다 —
          회원가입/계정 만들기, 로그인/이메일로 로그인하기. */}
      <ScreenHeader title="로그인" onPressIcon={() => router.back()} divider={false} />

      {/* 키보드가 올라와도 로그인 버튼이 가려지지 않게 화면을 밀어 올린다.

          ⚠️ behavior 를 **양쪽 다** 준다. 예전에는 iOS 에만 주고 안드로이드는 undefined 였는데,
             그러면 안드로이드에서 아무 일도 안 일어난다 — 「안드로이드는 창이 저절로 줄어든다」는
             옛말이고, app.json 의 edgeToEdgeEnabled: true 라 창이 안 줄고 앱이 키보드 뒤까지
             그린다(mobile/AGENTS.md). 이 화면은 칸이 둘이라 실제로 덮일 수 있었다. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <LoginForm onSuccess={close} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
});
