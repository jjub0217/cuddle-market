import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFieldScroll } from '@/lib/signup/use-field-scroll';
import { useSignupForm } from '@/lib/signup/use-signup-form';

// A안 — 웹과 같이 한 화면에 전부 놓는다.
// B안(app/signup-b.tsx)과 로직은 같고 배치만 다르다. 실기기로 비교한 뒤 하나를 지운다(#798).
//
// 헤더를 직접 그리는 이유는 login.tsx와 같다: native-stack 헤더에는 상단 인셋
// 옵션이 없어 실기기에서 상태바와 붙어 보인다.

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

  const handleSubmit = async () => {
    const ok = await form.submit();
    if (ok) router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
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
          // iOS 16+는 키보드 높이만큼 여백을 자동으로 잡아준다.
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.heading}>회원가입</Text>

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
            />
          </View>

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
    paddingHorizontal: 12,
  },
  backPressed: { opacity: 0.5 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
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
