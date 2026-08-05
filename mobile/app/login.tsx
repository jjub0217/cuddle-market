import { needsSocialSignup } from '@cuddle/shared';
import { Image } from 'expo-image';
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

import { ScreenHeader } from '@/components/ui/screen-header';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { LOGO_ASPECT_RATIO } from '@/components/ui/app-header';
import { fetchMe } from '@/lib/profile';
import { showToast } from '@/lib/toast';

// 로그인 **관문**. 방법만 고르고, 이메일 폼은 다음 화면(email-login.tsx)에 있다.
// 왜 둘로 나눴는지는 email-login.tsx 위에 적어 뒀다(3바퀴 설계 §8.1에서 합의).
//
// 탭바까지 덮는 루트 스택 화면이라, 닫으면 원래 보던 자리로 돌아간다.
//
// 헤더를 직접 그리는 이유는 상세 화면(detail-header.tsx)과 같다:
// native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다.

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
      {/* 인증 화면이라 아래 선을 끈다 — 흰 화면 한 장에 내용이 가운데로 모여 있어
          선이 화면을 가로로 자른다 */}
      <ScreenHeader title="로그인" onPressIcon={close} divider={false} />

      {/* 키보드가 올라와도 로그인 버튼이 가려지지 않게 화면을 밀어 올린다. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 로고를 가운데에. 웹 로그인도 제목 위에 로고를 가운데로 둔다(Login.tsx:19). */}
          <View style={styles.logoBox}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="커들마켓"
            />
          </View>

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

          {/* 화면 맨 아래 보조 링크 두 줄기. 단추(로그인하는 길)와 달리 「다른 데로 가는 길」이라
              한 줄에 모아 둔다 — 사이의 세로 막대가 둘을 가른다.

              웹은 문구가 다르다(폼 안의 「비밀번호를 잊으셨나요?」 · 「회원가입하기」).
              웹의 그 둘은 각자 다른 자리에 흩어져 있어서 문장으로 풀어 쓴 것이고, 여기는
              나란한 링크 둘이라 이름만 남긴다.

              「비밀번호 찾기」는 #829 에서 웹 페이지를 열게 해 뒀던 것을 #838 에서 앱 안
              화면으로 바꿨다. 문구는 그 화면의 제목과 같은 말이다(app/find-password.tsx). */}
          <View style={styles.bottomLinks}>
            <Pressable
              onPress={() => router.push('/find-password')}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => (pressed ? styles.bottomLinkPressed : undefined)}
            >
              <Text style={styles.bottomLinkText}>비밀번호 찾기</Text>
            </Pressable>

            {/* 가르는 막대. 글자가 아니라 장식이라 읽어 줄 것이 없다 */}
            <View style={styles.bottomLinkDivider} />

            <Pressable
              onPress={() => router.push('/signup')}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => (pressed ? styles.bottomLinkPressed : undefined)}
            >
              <Text style={styles.bottomLinkText}>회원가입</Text>
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
  // 로고부터 「회원가입하기」까지가 화면 가운데에 오도록 세로로 모은다.
  //
  // flexGrow: 1 이 있어야 한다 — ScrollView의 내용 상자는 기본적으로 내용만큼만
  // 커져서, justifyContent 만 주면 가운데로 갈 여백 자체가 없다. 상자를 화면 높이만큼
  // 늘린 뒤 가운데에 모은다. 내용이 화면보다 길어지면 그때는 평소처럼 스크롤된다.
  //
  // 가운데에서 **위로** 올린다. 위아래 여백을 다르게 주면 그 차이의 절반만큼
  // 올라간다 — 여기서는 (152 - 24) / 2 = 64 만큼이다. 더 올리려면 아래 값을 키운다
  // (올리고 싶은 만큼의 두 배를 24에 더한다).
  // (위쪽에는 헤더 52가 이미 있어서, 가운데에 그냥 두면 눈에는 약간 낮아 보인다)
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 152,
  },
  logoBox: {
    alignItems: 'center',
    // 로고와 첫 단추 사이. 옛 제목이 갖고 있던 24 → 40 → 56으로 늘려 왔다.
    // 로고를 56으로 키우면서 둘이 붙어 보였고, 로고가 화면의 얼굴이라 숨 쉴 자리를 준다
    marginBottom: 56,
  },
  // 홈 헤더의 로고는 36, 웹 로그인은 44다. 여기는 헤더가 아니라 화면의 얼굴이라
  // 그보다 크게 둔다. 폭은 비율에 맡긴다(가로로 늘어나면 글자가 뭉개진다).
  logo: { height: 56, aspectRatio: LOGO_ASPECT_RATIO },
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
  bottomLinks: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLinkPressed: {
    opacity: 0.6,
  },
  // 밑줄은 넣지 않는다. 색만으로 링크를 알리지 말라는 것은 글 속에 링크가 섞여 있어
  // 어디부터가 링크인지 헷갈릴 때의 이야기다. 여기는 한 줄이 통째로 링크 둘이고
  // 사이를 막대가 가르고 있어 헷갈릴 글이 없다. (웹은 폼 안 문장 옆이라 밑줄을 준다)
  bottomLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  // 희미한 회색 세로 막대. 높이 12는 글자(14)보다 낮아 글자를 누르지 않는다
  bottomLinkDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 12,
    backgroundColor: '#D1D5DB',
  },
});
