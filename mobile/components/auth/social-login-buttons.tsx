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
            <Text style={[styles.label, styles.googleLabel]}>Google 계정으로 로그인</Text>
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
    // 로고와 글자를 가운데에 나란히. 웹도 아이콘이 글자 왼쪽에 붙는다 —
    // `Button.tsx` 가 `iconSrc` 그림을 `children` 앞에 그린다
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.7 },
  // 웹과 같은 값(SocialLoginButtons.tsx의 bg-[#fee500] · bg-white + border-[#747775])
  kakao: { backgroundColor: '#FEE500' },
  // 구글 브랜딩 가이드의 「라이트」 테마 — 배경 #FFFFFF + 테두리 #747775 1px(안쪽).
  // https://developers.google.com/identity/branding-guidelines?hl=ko
  // 예전에는 「중립」 테마(#F2F2F2, 테두리 없음)였는데, 중립은 버튼과 대비되는 배경을
  // 전제한 값이다 — 웹에서 회색 배경과 1.02:1 로 묻혀 보이지 않아 둘 다 라이트로 옮겼다.
  // 테두리는 height: 48 안쪽에 그려져서 카카오 단추와 높이가 그대로 맞는다.
  google: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#747775' },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
  // 가이드가 정한 글자색. 카카오는 자체 가이드가 있어 위 기본값을 그대로 쓴다
  googleLabel: { color: '#1F1F1F' },
});
