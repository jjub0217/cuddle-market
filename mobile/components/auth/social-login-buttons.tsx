import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { startSocialLogin, type SocialProvider } from '@/lib/auth/social';
import { showToast } from '@/lib/toast';

// 웹 SocialLoginButtons.tsx와 같은 문구·같은 색·같은 차례(카카오 → 구글).
//
// ⚠️ 아이콘은 넣지 않았다. 웹은 /images/kakao.svg를 쓰는데 앱에는 그 파일이 없고,
//    SVG를 앱에서 그리려면 꾸러미가 하나 더 든다. 문구만으로도 어느 단추인지 분명하다.

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
          <Text style={styles.label}>카카오 간편 로그인</Text>
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
          <Text style={styles.label}>구글 간편 로그인</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  // 웹과 같은 값(SocialLoginButtons.tsx의 bg-[#fee500] · bg-[#F2F2F2])
  kakao: { backgroundColor: '#FEE500' },
  google: { backgroundColor: '#F2F2F2' },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
});
