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
import { IconSymbol } from '@/components/ui/icon-symbol';

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
          <IconSymbol name="chevron.left" size={26} color="#111827" />
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

          {/* ⚠️ 임시 — A안·B안을 실기기에서 비교하려고 둔다.
              하나를 고른 뒤 이 블록과 진 쪽 화면을 지우고 진짜 통로를 만든다(#798). */}
          <View style={styles.compare}>
            <Pressable
              onPress={() => router.push('/signup')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.compareButton, pressed && styles.comparePressed]}
            >
              <Text style={styles.compareLabel}>회원가입 (A안 · 한 화면)</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/signup-b')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.compareButton, pressed && styles.comparePressed]}
            >
              <Text style={styles.compareLabel}>회원가입 (B안 · 2단계)</Text>
            </Pressable>
          </View>
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
  // ⚠️ 임시 (#798)
  compare: {
    gap: 8,
    marginTop: 24,
  },
  compareButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparePressed: {
    opacity: 0.6,
  },
  compareLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
});
