import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginForm } from '@/components/auth/login-form';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { ChevronLeft } from 'lucide-react-native';

// 로그인. 탭바까지 덮는 루트 스택 화면이라, 닫으면 원래 보던 자리로 돌아간다.
//
// 헤더를 직접 그리는 이유는 상세 화면(detail-header.tsx)과 같다:
// native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다.

const HEADER_HEIGHT = 52;

export default function LoginScreen() {
  const router = useRouter();

  // 취소하고 돌아갈 곳이 없는 경우(딥링크 등)를 대비해 홈으로 떨어뜨린다.
  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // '/'는 홈과 마이 양쪽을 가리켜 어디로 갈지 정해지지 않는다(둘 다 그룹 안 index다).
      // 홈을 콕 집는다.
      router.replace('/(tabs)/(home)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <LoginForm onSuccess={close} />

          {/* 웹도 로그인 폼 아래·회원가입 링크 위에 둔다(Login.tsx:27-40). */}
          {/* ⚠️ 지금은 성공하면 화면만 닫는다. 추가 정보 입력으로 보내는 것은 Task 9에서 잇는다. */}
          <View style={styles.social}>
            <SocialLoginButtons onSignedIn={close} />
          </View>

          {/* 웹도 로그인 폼 아래에 같은 자리로 둔다(SignUpForm.tsx:195-200). */}
          <Pressable
            onPress={() => router.push('/signup')}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.signupLink, pressed && styles.signupLinkPressed]}
          >
            <Text style={styles.signupLinkText}>
              아직 계정이 없으신가요? <Text style={styles.signupLinkStrong}>회원가입하기</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backPressed: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  // 폼(gap 16)과 붙지 않게 한 칸 띄운다. 웹도 폼과 소셜 사이를 벌려 둔다(Login.tsx:26 gap-9).
  social: {
    marginTop: 16,
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupLinkPressed: {
    opacity: 0.6,
  },
  signupLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLinkStrong: {
    fontWeight: '600',
    color: '#111827',
  },
});
