import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

import { AddressField } from '@/components/signup/address-field';
import { BirthDateField } from '@/components/signup/birth-date-field';
import { EmailVerification } from '@/components/signup/email-verification';
import { Field, fieldStyles, messageStyles } from '@/components/signup/field';
import { PasswordChecklist } from '@/components/signup/password-checklist';
import { ChevronLeft } from 'lucide-react-native';
import { useFieldScroll } from '@/lib/signup/use-field-scroll';
import { useSignupForm } from '@/lib/signup/use-signup-form';

// 회원가입. 한 화면 안에서 두 단계로 나눈다.
//   1단계  이메일 인증 · 비밀번호
//   2단계  이름 · 닉네임 · 생년월일 · 거주지
//
// 왜 두 단계인가: 칸이 9개라 한 화면에 쭉 놓으면 키보드가 아래쪽을 덮는다.
// 1단계를 4칸으로 끊으면 아예 안 가린다. 한 화면 안(A안)과 둘 다 만들어
// 실기기로 비교한 뒤 이쪽을 골랐다(#798).
//
// 라우트를 둘로 쪼개지 않는 이유: 값이 한 컴포넌트에 모여 있어야 1단계로 돌아가도
// 입력이 남는다. 쪼개면 값을 넘기는 장치가 따로 필요하다.

const HEADER_HEIGHT = 52;

export default function SignupScreen() {
  const router = useRouter();
  const form = useSignupForm();
  const {
    scrollRef,
    onScrollViewLayout,
    onScroll,
    registerField,
    focusField,
    blurFields,
    keyboardHeight,
  } = useFieldScroll();
  const [step, setStep] = useState<1 | 2>(1);

  const goBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      return true; // 여기서 처리했으니 화면을 닫지 않는다
    }
    router.back();
    return true;
  }, [step, router]);

  // 안드로이드 하드웨어 뒤로가기. 2단계에서 누르면 1단계로 돌아간다.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
      return () => sub.remove();
    }, [goBack])
  );

  const handleSubmit = async () => {
    const ok = await form.submit();
    if (ok) router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
        <Text style={styles.stepLabel}>{step} / 2</Text>
      </View>

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
          {step === 1 ? (
            <>
              <Text style={styles.heading}>계정 만들기</Text>

              <View onLayout={registerField('email')}>
                <EmailVerification form={form} onFocus={focusField('email')} />
              </View>

              <View onLayout={registerField('password')}>
                <Field
                  label="비밀번호"
                  value={form.values.password}
                  onChangeText={(text) => form.setValue('password', text)}
                  onFocus={focusField('password')}
                  placeholder="비밀번호를 입력해주세요"
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  maxLength={30}
                />
                <PasswordChecklist
                  checks={form.passwordChecks}
                  visible={form.values.password.length > 0 || Boolean(form.errors.password)}
                />
              </View>

              <View onLayout={registerField('passwordConfirm')}>
                <Field
                  label="비밀번호 확인"
                  value={form.values.passwordConfirm}
                  onChangeText={(text) => form.setValue('passwordConfirm', text)}
                  onFocus={focusField('passwordConfirm')}
                  error={
                    form.passwordConfirmState === 'mismatch'
                      ? '비밀번호가 일치하지 않습니다'
                      : form.errors.passwordConfirm
                  }
                  success={
                    form.passwordConfirmState === 'match' ? '✓ 비밀번호가 일치합니다' : undefined
                  }
                  placeholder="비밀번호를 다시 입력해주세요"
                  secureTextEntry
                  autoCapitalize="none"
                  maxLength={30}
                />
              </View>

              <Pressable
                onPress={() => setStep(2)}
                disabled={!form.canGoNext}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.submitPressed,
                  !form.canGoNext && styles.submitDisabled,
                ]}
              >
                <Text style={styles.submitLabel}>다음</Text>
              </Pressable>

              {/* 인증 안 된 채로 2단계까지 다 채우고 막히는 게 최악이라 여기서 세운다. */}
              {!form.canGoNext ? (
                <Text style={styles.guide}>이메일 인증과 비밀번호를 먼저 끝내주세요.</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.heading}>프로필 입력</Text>

              <View onLayout={registerField('name')}>
                <Field
                  label="이름"
                  value={form.values.name}
                  onChangeText={(text) => form.setValue('name', text)}
                  onFocus={focusField('name')}
                  error={form.errors.name}
                  placeholder="이름을 입력해주세요"
                  maxLength={10}
                />
              </View>

              <View onLayout={registerField('nickname')}>
                <Field
                  label="닉네임"
                  value={form.values.nickname}
                  onChangeText={(text) => form.setValue('nickname', text)}
                  onFocus={focusField('nickname')}
                  error={form.errors.nickname}
                  placeholder="닉네임을 입력해주세요"
                  maxLength={10}
                  success={form.nicknameChecked ? '✓ 사용할 수 있는 닉네임이에요.' : undefined}
                  trailing={
                    <Pressable
                      onPress={form.checkNickname}
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
                <BirthDateField form={form} onFocus={focusField('birthDate')} />
              </View>

              <View onLayout={registerField('address')}>
                <AddressField form={form} onOpen={blurFields} />
              </View>

              {form.formError ? <Text style={messageStyles.error}>{form.formError}</Text> : null}

              <Pressable
                onPress={handleSubmit}
                disabled={!form.canSubmit || form.submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.submitPressed,
                  (!form.canSubmit || form.submitting) && styles.submitDisabled,
                ]}
              >
                {form.submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>가입하기</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backPressed: { opacity: 0.5 },
  stepLabel: { fontSize: 13, color: '#6B7280' },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  guide: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
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
