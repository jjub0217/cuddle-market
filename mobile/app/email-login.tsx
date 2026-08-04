import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const HEADER_HEIGHT = 52;

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
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
      </View>

      {/* 키보드가 올라와도 로그인 버튼이 가려지지 않게 화면을 밀어 올린다. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
  header: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backPressed: { opacity: 0.6 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
});
