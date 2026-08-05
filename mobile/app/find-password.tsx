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
import { Field, fieldStyles } from '@/components/signup/field';
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

/**
 * 막다른 길 안내 문구.
 *
 * **「비밀번호 대신」이 핵심이다.** 여기 온 사람은 「비밀번호를 찾으러」 왔으므로,
 * 「그럼 내 비밀번호는?」에 답이 있어야 발길을 돌린다. 「재설정이 불가능합니다」는 그 답이 없다.
 *
 * 어느 소셜인지 알면 콕 집어 말한다. 서버가 문구에 담아 준다(AuthProvider.displayName).
 * 모를 때(서버가 아직 옛 문구를 주는 동안)만 「카카오 또는 구글」로 벌려 쓴다 —
 * 「카카오·구글로 가입한」은 **둘 다로 가입한 것처럼** 읽힌다.
 */
function blockedText(blocked: 'kakao' | 'google' | 'social' | 'notFound'): string {
  if (blocked === 'notFound') {
    return '가입 이력이 없는 이메일이에요.\n이메일을 다시 확인해주세요.';
  }
  if (blocked === 'social') {
    return '카카오 또는 구글로 가입한 계정이에요.\n비밀번호 대신 그 방법으로 로그인해주세요.';
  }
  const name = blocked === 'kakao' ? '카카오' : '구글';
  return `${name}로 가입한 계정이에요.\n비밀번호 대신 ${name} 로그인을 이용해주세요.`;
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
              {/* 단추를 칸 **옆**에 둔다. 가입 화면의 이메일 인증과 같은 모양이다
                  (components/signup/email-verification.tsx). 웹 비밀번호 찾기는 칸 아래
                  전체폭 단추를 쓰지만, 앱 안에서 가입과 갈리는 편이 더 어색하다 —
                  같은 사람이 며칠 사이에 두 화면을 다 겪는다. */}
              <Field
                label="이메일 주소"
                value={form.values.email}
                onChangeText={(text) => form.setValue('email', text)}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={form.errors.email}
                trailing={
                  <Pressable
                    onPress={() => void form.sendCode()}
                    // 보내는 동안 또 누르면 코드가 두 번 나가고 뒤엣것만 유효해진다
                    disabled={form.sending}
                    accessibilityRole="button"
                    style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
                  >
                    {form.sending ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Text style={fieldStyles.buttonLabel}>인증받기</Text>
                    )}
                  </Pressable>
                }
              />

              {/* 막다른 길 안내. 「고쳐서 다시 하세요」(칸 아래 빨간 오류)와 성격이 달라
                  모양도 다르게 둔다 — 이건 「여기 말고 저쪽으로 가세요」다.
                  둘 다 갈 곳을 함께 준다. 「안 됩니다」로 끝나면 그 사람은 거기서 떠난다. */}
              {form.blocked ? (
                <View style={styles.blockedBox}>
                  <Text style={styles.blockedText}>{blockedText(form.blocked)}</Text>
                  <Pressable
                    onPress={() =>
                      form.blocked === 'notFound' ? router.replace('/signup') : router.replace('/login')
                    }
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.blockedButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.blockedButtonLabel}>
                      {form.blocked === 'notFound' ? '회원가입하러 가기' : '로그인하러 가기'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

            </View>
          ) : null}

          {form.step === 2 ? (
            <View style={styles.group}>
              {/* 여기도 칸 옆이다. 가입 화면의 인증코드 칸과 같다 */}
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
                trailing={
                  <Pressable
                    onPress={() => void form.submitCode()}
                    disabled={form.verifying}
                    accessibilityRole="button"
                    style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
                  >
                    {form.verifying ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Text style={fieldStyles.buttonLabel}>확인</Text>
                    )}
                  </Pressable>
                }
              />


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
  blockedBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, gap: 10 },
  blockedText: { fontSize: 13, lineHeight: 19, color: '#374151' },
  // 막다른 길에서는 **이 단추가 유일한 길**이라 주 단추 색을 쓴다(앱의 기본 단추와 같은 값).
  // 연한 색으로 두면, 방금 서버가 「안 된다」고 답한 「인증받기」보다 덜 눈에 띄어 위계가
  // 거꾸로가 된다. 웹은 아래 「인증코드 전송」을 숨겨서 같은 결과를 만든다 —
  // 앱은 그 단추가 칸 안(trailing)에 있어 숨기면 칸이 갑자기 달라 보여서 색으로 가른다.
  blockedButton: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  blockedButtonLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
