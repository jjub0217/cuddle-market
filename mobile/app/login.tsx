import { needsSocialSignup } from '@cuddle/shared';
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

import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { fetchMe } from '@/lib/profile';
import { showToast } from '@/lib/toast';
import { ChevronLeft } from 'lucide-react-native';

// 로그인 **관문**. 방법만 고르고, 이메일 폼은 다음 화면(email-login.tsx)에 있다.
// 왜 둘로 나눴는지는 email-login.tsx 위에 적어 뒀다(3바퀴 설계 §8.1에서 합의).
//
// 탭바까지 덮는 루트 스택 화면이라, 닫으면 원래 보던 자리로 돌아간다.
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

  // 소셜 로그인이 성공한 뒤 어디로 갈지는 **화면**이 정한다. 단추 조각은 로그인만 안다.
  const handleSocialSignedIn = async () => {
    try {
      const me = await fetchMe();
      if (needsSocialSignup(me)) {
        // 건너뛸 수 없는 화면이라 push가 아니라 replace다 — 로그인 화면이 뒤에 남으면 안 된다.
        router.replace('/social-signup');
        return;
      }
    } catch {
      // 프로필을 못 읽어도 **로그인은 이미 됐다.** 여기서 로그아웃시키면
      // 방금 성공한 로그인을 되돌리는 셈이다. 그냥 닫고 알린다.
      showToast('내 정보를 불러오지 못했어요. 마이에서 다시 확인해주세요.');
    }
    close();
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
          <Text style={styles.heading}>로그인</Text>

          {/* 이메일이 맨 위, 그다음 소셜. 3바퀴 설계 §8.1의 A안 그림 그대로다. */}
          <Pressable
            onPress={() => router.push('/email-login')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.email, pressed && styles.emailPressed]}
          >
            <Text style={styles.emailLabel}>이메일로 로그인</Text>
          </Pressable>

          <View style={styles.social}>
            <SocialLoginButtons onSignedIn={() => void handleSocialSignedIn()} />
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
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  // 앱의 기본 단추 색(로그인 폼의 「로그인」과 같다). 소셜은 각자 브랜드 색이라
  // 이것만 진하게 두면 「우리 계정으로 들어가는 길」이 먼저 읽힌다
  email: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  emailPressed: { opacity: 0.8 },
  emailLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  // 소셜 단추 묶음. 이메일 단추와 같은 간격(8)으로 이어 붙인다
  social: {
    marginTop: 8,
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
