import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { Field, fieldStyles } from '@/components/signup/field';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { findAccount, NetworkUnreachableError } from '@/lib/find-account/api';
import { validateEmail } from '@/lib/signup/validation';

// 계정 찾기. **「가입 방법」을 알려주는 화면**이다(#849).
//
// 이 서비스는 이메일이 곧 아이디라 전통적인 「아이디 찾기」가 필요 없다. 사용자가
// 모르는 것은 **어떻게 가입했는가**(이메일·카카오·구글)다.
//
// 겉모양은 비밀번호 찾기(app/find-password.tsx)의 1단계와 같은 틀이다 — 칸 옆에 단추,
// 그 아래 안내 박스. 두 화면을 오가는 사람이 많아서 달라 보이면 안 된다.
// 다만 **단계가 없다.** 한 번 넣고 끝이다.

/**
 * 제출한 뒤 보여주는 **단 하나의 문구**. 웹과 **글자까지 같다**
 * (src/features/find-account/components/FindAccountForm.tsx 의 SENT_MESSAGE).
 *
 * ⚠️ 이 화면은 「이 이메일이 회원인가」를 **절대 말하지 않는다.** 말하는 순간
 *    남의 이메일을 넣어 보는 것만으로 누가 이 서비스에 가입했는지 알아낼 수 있다.
 *    그래서 가입이든 미가입이든, 이메일 가입이든 소셜이든 **같은 글자**가 나온다.
 *
 * 진짜 안내(「카카오로 가입되어 있어요」)는 **메일로** 간다. 메일함을 여는 사람은
 * 그 주소의 주인뿐이라 거기서는 알려 줘도 된다.
 */
const SENT_MESSAGE = '가입된 계정이 있다면 안내 메일을 보냈습니다.\n메일함을 확인해주세요.';

/**
 * 서버에 닿지도 못했을 때의 문구. 이것도 웹과 같은 글자다(NETWORK_MESSAGE).
 *
 * ⚠️ 이것만 다른 말을 한다. 그래도 안 새는 까닭: **넣은 이메일과 아무 상관이 없다.**
 *    비행기 모드에서는 어떤 이메일을 넣어도 이 문구가 나온다.
 */
const NETWORK_MESSAGE = '지금은 연결이 되지 않아요. 잠시 후 다시 시도해주세요.';

export default function FindAccountScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  /**
   * 화면이 가질 수 있는 상태는 셋뿐이다.
   *
   *   idle      아직 안 눌렀다
   *   sent      **서버가 무엇을 답했든** 여기로 온다
   *   offline   서버에 닿지도 못했다
   *
   * 서버 응답을 담는 자리가 아예 없다. 담을 곳이 없으면 실수로 화면에 뿌릴 수도 없다 —
   * 비밀번호 찾기는 담아 두었다가 그대로 뿌린다(use-find-password.ts 의 blocked).
   */
  const [status, setStatus] = useState<'idle' | 'sent' | 'offline'>('idle');
  const [sending, setSending] = useState(false);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // '/'는 홈과 마이 양쪽을 가리켜 어디로 갈지 정해지지 않는다. 홈을 콕 집는다.
      router.replace('/(tabs)/(home)');
    }
  };

  const handleSubmit = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setSending(true);
    try {
      await findAccount(email.trim());
      setStatus('sent');
    } catch (error) {
      // ⚠️ 갈래가 **둘뿐이다.** 서버가 뭐라 답했는지는 api 계층에서 이미 버렸다
      //    (lib/find-account/api.ts). 여기서 볼 수 있는 것은 「닿았나 못 닿았나」뿐이다.
      setStatus(error instanceof NetworkUnreachableError ? 'offline' : 'sent');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 인증 화면이라 아래 선을 끈다 — 비밀번호 찾기와 같은 규칙이다 */}
      <ScreenHeader title="계정 찾기" onPressIcon={close} divider={false} />

      {/* ⚠️ behavior 를 **양쪽 다** 준다. iOS 에만 주면 안드로이드에서 아무 일도 안 일어난다 —
          app.json 의 edgeToEdgeEnabled 때문에 창이 저절로 안 줄어든다(mobile/AGENTS.md). */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headline}>
            <Text style={styles.headlineTitle}>계정 찾기</Text>
            {/* 웹 FindAccountPage 의 desc 와 같은 말이다 */}
            <Text style={styles.headlineDesc}>가입 방법을 잊으셨다면 이메일로 알려드립니다</Text>
          </View>

          {status === 'idle' ? (
            <View style={styles.group}>
              {/* 단추를 칸 옆에 둔다. 비밀번호 찾기 1단계와 같은 모양이다 */}
              <Field
                label="이메일 주소"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(undefined);
                }}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
                trailing={
                  <Pressable
                    onPress={() => void handleSubmit()}
                    // 보내는 동안 또 누르면 메일이 두 번 나간다
                    disabled={sending}
                    accessibilityRole="button"
                    style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={colors.onSurface} />
                    ) : (
                      <Text style={fieldStyles.buttonLabel}>메일 받기</Text>
                    )}
                  </Pressable>
                }
              />
            </View>
          ) : (
            // 결과 박스. 비밀번호 찾기의 「막다른 길」 박스와 같은 모양이다
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                {status === 'sent' ? SENT_MESSAGE : NETWORK_MESSAGE}
              </Text>
              <Pressable
                onPress={() => router.replace('/login')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}
              >
                <Text style={styles.resultButtonLabel}>로그인하러 가기</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 24 },
  headline: { gap: 6 },
  headlineTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  headlineDesc: { fontSize: 14, color: colors.onSurfaceMuted },
  group: { gap: 16 },
  pressed: { opacity: 0.8 },
  // 비밀번호 찾기의 blockedBox 와 같은 값이다
  resultBox: { backgroundColor: colors.surfaceMuted, borderRadius: 8, padding: 14, gap: 10 },
  resultText: { fontSize: 13, lineHeight: 19, color: colors.onSurfaceStrong },
  // 여기서는 **이 단추가 유일한 길**이라 주 단추 색을 쓴다(blockedButton 과 같은 값)
  resultButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
  resultButtonLabel: { fontSize: 15, fontWeight: '600', color: colors.onAction },
});
