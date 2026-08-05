import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { StepIndicator } from '@/components/find-password/step-indicator';
import { Field } from '@/components/signup/field';
import { PasswordChecklist } from '@/components/signup/password-checklist';
import { useFindPassword } from '@/lib/find-password/use-find-password';
import { showToast } from '@/lib/toast';

// 비밀번호 찾기. 한 화면 안에서 3단계로 간다 — 웹도 주소 하나에서 이렇게 한다.
//
// 앞 단계 값은 칸으로 남기지 않고 **헤더 문구**로 알린다(웹과 같은 방식).
// 헤더는 공용 조각(components/ui/screen-header.tsx)을 쓴다 — 앱의 모든 화면이 같은 틀이다(#841).

/** 남은 시간을 4:59 꼴로. 가입 화면의 mmss 와 같은 규칙이다. */
function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FindPasswordScreen() {
  const router = useRouter();
  const form = useFindPassword();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // '/'는 홈과 마이 양쪽을 가리켜 어디로 갈지 정해지지 않는다. 홈을 콕 집는다.
      router.replace('/(tabs)/(home)');
    }
  };

  const handleBack = () => {
    if (form.step === 1) {
      close();
      return;
    }
    form.goPreviousStep();
  };

  const handleSubmitNewPassword = async () => {
    const ok = await form.submitNewPassword();
    if (!ok) return;
    showToast('비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.');
    // replace — 뒤로가기로 방금 끝낸 재설정 화면에 돌아오면 안 된다
    router.replace('/email-login');
  };

  // 앞 단계에서 넣은 값을 여기서 알린다. 칸을 남기지 않는 대신이다.
  //
  // 제목은 **웹 StepHeader 와 같은 말**이다(이메일 입력 · 이메일 인증 · 비밀번호 재설정).
  // 예전에는 3단계를 「새 비밀번호」로 줄였는데, 그건 단계 표시에 이름표가 있던 때
  // 가로 폭을 아끼려던 것이었다. 이름표를 뺐으니 웹 문구로 되돌린다.
  //
  // ⚠️ 설명은 웹을 안 베꼈다. 웹 StepHeader 의 3단계 설명이 1단계 것과 똑같다
  //    (「가입하신 이메일을 입력하면…」) — 베껴 쓴 흔적으로 보인다. 여기서는 그 단계에
  //    맞는 말을 쓴다.
  const headline =
    form.step === 3
      ? { title: '비밀번호 재설정', desc: '새로 쓸 비밀번호를 입력해주세요' }
      : form.step === 2
        ? { title: '이메일 인증', desc: `${form.values.email}로 인증코드를 보냈어요` }
        : { title: '이메일 입력', desc: '가입하신 이메일을 입력하면 인증코드를 보내드려요' };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 인증 화면이라 아래 선을 끈다 — 흰 화면 한 장에 내용이 모여 있어 선이 화면을 자른다 */}
      <ScreenHeader title="비밀번호 찾기" onPressIcon={handleBack} divider={false} />

      {/* ⚠️ behavior 를 **양쪽 다** 준다. Platform.OS === 'ios' ? 'padding' : undefined 로 두면
          안드로이드에서 아무 일도 안 일어난다 — app.json 의 edgeToEdgeEnabled 때문에 창이
          저절로 줄지 않아 앱이 키보드 뒤까지 그린다(mobile/AGENTS.md). */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 이 한 줄이 단계 표시다. 빼기로 하면 여기만 지운다(설계 §3) */}
          <StepIndicator current={form.step} />

          <View style={styles.headline}>
            <Text style={styles.headlineTitle}>{headline.title}</Text>
            <Text style={styles.headlineDesc}>{headline.desc}</Text>
          </View>

          {form.step === 1 ? (
            <View style={styles.group}>
              <Field
                label="이메일 주소"
                value={form.values.email}
                onChangeText={(text) => form.setValue('email', text)}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={form.errors.email}
              />

              {/* 서버가 막았을 때 「안 된다」로 끝내지 않고 갈 길을 준다.
                  여기 온 사람은 대개 카카오·구글로 가입한 걸 잊고 헤매다 온 사람이다. */}
              {form.socialBlocked ? (
                <View style={styles.socialBox}>
                  <Text style={styles.socialText}>
                    카카오·구글로 가입한 계정이에요.{'\n'}그 방법으로 로그인해주세요.
                  </Text>
                  <Pressable
                    onPress={() => router.replace('/login')}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.socialButtonLabel}>로그인하러 가기</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                onPress={() => void form.sendCode()}
                disabled={form.sending}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                {form.sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>인증코드 받기</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {form.step === 2 ? (
            <View style={styles.group}>
              <Field
                label="인증코드"
                value={form.values.code}
                onChangeText={(text) => form.setValue('code', text)}
                placeholder="6자리 인증코드 입력"
                keyboardType="number-pad"
                maxLength={6}
                error={form.errors.code}
                hint={form.secondsLeft > 0 ? `남은 시간 ${mmss(form.secondsLeft)}` : undefined}
                hintTone={form.secondsLeft > 0 && form.secondsLeft <= 60 ? 'danger' : 'muted'}
              />

              <Pressable
                onPress={() => void form.submitCode()}
                disabled={form.verifying}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                {form.verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>확인</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => void form.sendCode()}
                disabled={form.sending}
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => (pressed ? styles.pressed : undefined)}
              >
                <Text style={styles.linkText}>인증코드 다시 받기</Text>
              </Pressable>
            </View>
          ) : null}

          {form.step === 3 ? (
            <View style={styles.group}>
              <Field
                label="새 비밀번호"
                value={form.values.password}
                onChangeText={(text) => form.setValue('password', text)}
                placeholder="비밀번호를 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                error={form.errors.password}
              />
              <PasswordChecklist
                checks={form.passwordChecks}
                visible={form.values.password.length > 0 || Boolean(form.errors.password)}
              />

              <Field
                label="새 비밀번호 확인"
                value={form.values.passwordConfirm}
                onChangeText={(text) => form.setValue('passwordConfirm', text)}
                placeholder="비밀번호를 다시 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                error={form.errors.passwordConfirm}
              />

              {form.formError ? <Text style={styles.formError}>{form.formError}</Text> : null}

              <Pressable
                onPress={() => void handleSubmitNewPassword()}
                disabled={form.submitting}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                {form.submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>비밀번호 변경</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 24 },
  headline: { gap: 6 },
  headlineTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headlineDesc: { fontSize: 14, color: '#6B7280' },
  group: { gap: 16 },
  // 이메일 로그인 화면의 「로그인」 단추와 같은 값이다. 두 화면이 달라 보이면 안 된다
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  submitLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  formError: { fontSize: 13, fontWeight: '600', color: '#C91D1D' },
  socialBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, gap: 10 },
  socialText: { fontSize: 13, lineHeight: 19, color: '#374151' },
  // 카카오 노란색·구글 흰색과 겹치지 않게 앱의 보조 단추 색(primary-100)을 쓴다
  socialButton: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E3BF',
  },
  socialButtonLabel: { fontSize: 14, fontWeight: '600', color: '#633F00' },
});
