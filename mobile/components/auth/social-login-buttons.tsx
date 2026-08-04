import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleLogo, KakaoLogo } from '@/components/auth/social-logos';
import { startSocialLogin, type SocialProvider } from '@/lib/auth/social';
import { showToast } from '@/lib/toast';

// 웹 SocialLoginButtons.tsx와 같은 문구·같은 색·같은 차례(카카오 → 구글)·같은 로고.
//
// ⚠️ 로고를 빼면 안 된다. 카카오·구글 모두 로그인 단추의 로고와 색을 가이드로 정해 두었다.
//    로고는 social-logos.tsx가 그린다(웹의 svg를 그대로 옮겼다).

interface Props {
  /** 로그인에 성공했을 때. 보통 화면을 닫거나 추가 정보로 보낸다 */
  onSignedIn: () => void;
}

export function SocialLoginButtons({ onSignedIn }: Props) {
  // 어느 단추가 도는 중인지. 둘 다 잠가야 브라우저가 두 번 열리지 않는다
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const press = async (provider: SocialProvider) => {
    if (busy) return;

    setBusy(provider);
    try {
      const result = await startSocialLogin(provider);

      // 사용자가 스스로 닫았으면 아무 말도 하지 않는다
      if (result.kind === 'canceled') return;
      if (result.kind === 'failed') {
        showToast(result.message);
        return;
      }
      onSignedIn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.group}>
      <Pressable
        onPress={() => void press('kakao')}
        disabled={busy !== null}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.kakao, pressed && styles.pressed]}
      >
        {busy === 'kakao' ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <>
            <KakaoLogo />
            <Text style={styles.label}>카카오 간편 로그인</Text>
          </>
        )}
      </Pressable>

      <Pressable
        onPress={() => void press('google')}
        disabled={busy !== null}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, styles.google, pressed && styles.pressed]}
      >
        {busy === 'google' ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <>
            <GoogleLogo />
            <Text style={styles.label}>구글 간편 로그인</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  button: {
    height: 48, // 이메일 로그인 단추와 같은 높이 — 셋이 나란히 서면 높이가 맞아야 한다
    borderRadius: 8,
    // 로고와 글자를 가운데에 나란히. 웹도 아이콘이 글자 왼쪽에 붙는다(Button.tsx:29)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.7 },
  // 웹과 같은 값(SocialLoginButtons.tsx의 bg-[#fee500] · bg-[#F2F2F2])
  kakao: { backgroundColor: '#FEE500' },
  google: { backgroundColor: '#F2F2F2' },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
});
