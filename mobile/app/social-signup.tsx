import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RegionField } from '@/components/products/region-field';
import { BirthDateField } from '@/components/signup/birth-date-field';
import { Field, fieldStyles, messageStyles } from '@/components/signup/field';
import { fetchMe, updateMe } from '@/lib/profile';
import { checkNicknameAvailable } from '@/lib/signup/api';
import { useFieldScroll } from '@/lib/signup/use-field-scroll';
import { formatBirthDate, validateBirthDate, validateNickname } from '@/lib/signup/validation';
import { showToast } from '@/lib/toast';

// 소셜로 처음 들어온 사람에게 모자란 정보를 더 받는다.
// 웹 src/features/signup/SocialSignup.tsx의 짝이다 — 제목·설명 문구가 같다.
//
// 왜 useSignupForm을 안 쓰나: 그 훅은 이메일 인증·비밀번호를 끌어안고 있어서
// (canGoNext가 verification==='verified'를 요구한다) 여기서는 절대 제출이 안 된다.
// 칸 셋뿐이라 값은 이 화면이 직접 들고, 규칙 함수만 가입 화면과 나눠 쓴다.
//
// ⚠️ 이 화면은 건너뛸 수 없다(설계 §4-3). 헤더에 뒤로가기가 없고, 안드로이드
//    하드웨어 뒤로가기도 막는다. 서버는 이 값들이 없으면 다른 기능을 막는다.

// 칸 셋 차례는 앱 가입 화면(app/signup.tsx)과 같이 닉네임 → 생년월일 → 거주지다.
// 웹은 닉네임 → 거주지 → 생년월일이지만, 같은 앱 안에서 두 가입 화면이 다르면
// 더 어색하다. 문구는 웹 그대로다.

export default function SocialSignupScreen() {
  const router = useRouter();
  const {
    scrollRef,
    onScrollViewLayout,
    onScroll,
    registerField,
    focusField,
    blurFields,
    keyboardHeight,
  } = useFieldScroll();

  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [birth, setBirth] = useState({ year: '', month: '', day: '' });
  const [region, setRegion] = useState({ sido: '', gugun: '' });

  const [nicknameError, setNicknameError] = useState<string | undefined>();
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [birthError, setBirthError] = useState<string | undefined>();
  const [regionError, setRegionError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 안드로이드 하드웨어 뒤로가기를 삼킨다. true를 돌려주면 화면이 안 닫힌다.
  // (app/signup.tsx:62-67과 같은 방식. 거기는 2단계→1단계로 돌아가지만 여기는 늘 막는다)
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  // 닉네임 첫 값은 서버가 소셜 계정에서 받아 만들어 둔 것으로 채운다.
  // 웹도 같다(SocialSignUpForm.tsx:50 defaultValues.nickname = user?.nickname).
  useEffect(() => {
    let alive = true;

    fetchMe()
      .then((me) => {
        if (!alive) return;
        setNickname(me.nickname ?? '');
      })
      .catch(() => {
        // 못 읽어도 화면을 막지 않는다 — 직접 쳐 넣으면 저장은 된다.
        if (!alive) return;
        showToast('내 정보를 불러오지 못했어요. 닉네임을 직접 입력해주세요.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const changeNickname = (value: string) => {
    setNickname(value);
    setNicknameError(undefined);
    setFormError(null);
    // 고치면 확인이 무효가 된다. 안 그러면 확인한 적 없는 닉네임으로 저장된다
    // (use-signup-form.ts:74와 같은 이유).
    setNicknameChecked(false);
  };

  const checkNickname = async () => {
    const error = validateNickname(nickname);
    if (error) {
      setNicknameError(error);
      return;
    }

    try {
      const available = await checkNicknameAvailable(nickname.trim());
      if (!available) {
        setNicknameError('이미 사용 중인 닉네임이에요.');
        setNicknameChecked(false);
        return;
      }
      setNicknameChecked(true);
    } catch {
      setNicknameError('닉네임 확인에 실패했어요.');
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // 어느 칸이 문제인지 화면에 다 표시한다. 첫 오류에서 멈추면 눌러 볼 때마다 하나씩 나온다.
    const nicknameProblem = validateNickname(nickname);
    const birthProblem = validateBirthDate(birth.year, birth.month, birth.day);
    const regionProblem = region.sido && region.gugun ? null : '거주지를 선택해주세요';

    setNicknameError(nicknameProblem ?? undefined);
    setBirthError(birthProblem ?? undefined);
    setRegionError(regionProblem ?? undefined);
    if (nicknameProblem || birthProblem || regionProblem) return;

    if (!nicknameChecked) {
      setNicknameError('닉네임 중복체크를 완료해주세요.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await updateMe({
        nickname: nickname.trim(),
        birthDate: formatBirthDate(birth.year, birth.month, birth.day),
        addressSido: region.sido,
        addressGugun: region.gugun,
      });
      // 뒤로 갈 곳이 없는 화면이라 replace로 갈아탄다. '/'는 홈과 마이 양쪽을
      // 가리켜 어디로 갈지 정해지지 않는다(login.tsx:34와 같은 이유).
      router.replace('/(tabs)/(home)');
    } catch (err) {
      if (err instanceof TypeError) {
        setFormError('인터넷 연결을 확인해주세요.');
      } else {
        setFormError(err instanceof Error ? err.message : '저장 중 문제가 발생했어요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 뒤로가기가 없는 헤더. 자리만 잡아 제목이 상태바에 붙지 않게 한다 */}
      <View style={styles.header} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          onLayout={onScrollViewLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardHeight }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* 문구는 웹 그대로다(SocialSignup.tsx:8 TitleSection) */}
          <Text style={styles.heading}>추가 정보 입력</Text>
          <Text style={styles.desc}>서비스 이용을 위해 아래 정보가 필요합니다</Text>

          {loading ? (
            <ActivityIndicator style={styles.loading} color="#111827" />
          ) : (
            <>
              <View onLayout={registerField('nickname')}>
                <Field
                  label="닉네임"
                  value={nickname}
                  onChangeText={changeNickname}
                  onFocus={focusField('nickname')}
                  error={nicknameError}
                  placeholder="닉네임을 입력해주세요"
                  maxLength={10}
                  success={nicknameChecked ? '✓ 사용할 수 있는 닉네임이에요.' : undefined}
                  trailing={
                    <Pressable
                      onPress={() => void checkNickname()}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        fieldStyles.button,
                        pressed && fieldStyles.buttonPressed,
                      ]}
                    >
                      <Text style={fieldStyles.buttonLabel}>중복체크</Text>
                    </Pressable>
                  }
                />
              </View>

              <View onLayout={registerField('birthDate')}>
                <BirthDateField
                  year={birth.year}
                  month={birth.month}
                  day={birth.day}
                  error={birthError}
                  onChange={(part, value) => {
                    setBirth((prev) => ({ ...prev, [part]: value }));
                    setBirthError(undefined);
                    setFormError(null);
                  }}
                  onFocus={focusField('birthDate')}
                />
              </View>

              <View onLayout={registerField('address')}>
                <RegionField
                  sido={region.sido}
                  gugun={region.gugun}
                  error={regionError}
                  onChange={(sido, gugun) => {
                    setRegion({ sido, gugun });
                    setRegionError(undefined);
                    setFormError(null);
                  }}
                  onOpen={blurFields}
                />
              </View>

              {formError ? <Text style={messageStyles.error}>{formError}</Text> : null}

              <Pressable
                onPress={() => void handleSubmit()}
                disabled={submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.submitPressed,
                  submitting && styles.submitDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  // 웹 SocialSignUpForm.tsx:142의 단추 문구 그대로다
                  <Text style={styles.submitLabel}>회원가입</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 52;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { height: HEADER_HEIGHT },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  // 크기는 가입 화면 제목과 같은 값이다(signup.tsx styles.heading).
  // marginBottom은 두지 않는다 — 바로 아래 설명 문구가 붙어야 한 덩어리로 읽힌다
  heading: { fontSize: 22, fontWeight: '700', color: '#111827' },
  // 설명은 칸 아래 안내 문구(messageStyles.hint)와 같은 값이다
  desc: { fontSize: 13, color: '#6B7280', marginTop: -8 },
  loading: { marginTop: 24 },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginTop: 8,
  },
  submitPressed: { opacity: 0.8 },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
