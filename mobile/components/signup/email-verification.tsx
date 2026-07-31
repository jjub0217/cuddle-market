import { Pressable, StyleSheet, Text, View, type TextInputProps } from 'react-native';

import type { useSignupForm } from '@/lib/signup/use-signup-form';
import { Field, fieldStyles, messageStyles } from './field';

// 이메일 인증 영역. 상태가 셋이다.
//   ① idle      이메일 칸 + [인증받기]
//   ② sent      이메일 칸(잠김) + 인증코드 칸 + [확인] + 남은 시간
//   ③ verified  이메일 칸(잠김) + "✓ 인증 완료" + [이메일 변경]
//
// 인증이 끝나면 이메일 칸을 잠그고 재발송 버튼을 없앤다. 둘 다 이유가 있다:
// 인증한 주소와 가입하는 주소가 달라지면 서버가 막고(설계 §6·§7), 재발송하면
// 서버가 기존 인증 기록을 지워 역시 가입이 막힌다.

interface Props {
  form: ReturnType<typeof useSignupForm>;
  onFocus?: TextInputProps['onFocus'];
}

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function EmailVerification({ form, onFocus }: Props) {
  const { values, errors, verification, secondsLeft } = form;
  const verified = verification === 'verified';

  return (
    <View style={styles.wrap}>
      <Field
        label="이메일 주소"
        value={values.email}
        onChangeText={(text) => form.setValue('email', text)}
        onFocus={onFocus}
        error={errors.email}
        placeholder="example@cuddle.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        editable={!verified}
        style={verified ? styles.locked : undefined}
        hint={verified ? undefined : '사용 가능 여부를 확인한 뒤 인증코드를 보내드려요.'}
        trailing={
          verified ? null : (
            <Pressable
              onPress={form.sendCode}
              accessibilityRole="button"
              style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
            >
              <Text style={fieldStyles.buttonLabel}>
                {verification === 'sent' ? '재발송' : '인증받기'}
              </Text>
            </Pressable>
          )
        }
      />

      {verified ? (
        <View style={styles.verifiedRow}>
          <Text style={messageStyles.success}>✓ 이메일 인증이 완료되었어요.</Text>
          <Pressable onPress={form.changeEmail} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.changeLink}>이메일 변경</Text>
          </Pressable>
        </View>
      ) : null}

      {verification === 'sent' ? (
        <Field
          label="인증코드"
          value={values.code}
          // 숫자 6자리만 받는다. 붙여넣기로 다른 문자가 들어와도 여기서 걸러진다.
          onChangeText={(text) => form.setValue('code', text.replace(/[^0-9]/g, '').slice(0, 6))}
          onFocus={onFocus}
          error={errors.code}
          placeholder="전송된 코드를 입력해주세요"
          keyboardType="number-pad"
          maxLength={6}
          hint={`남은 시간 ${mmss(secondsLeft)} · 메일이 안 오면 스팸함을 확인해주세요.`}
          trailing={
            <Pressable
              onPress={form.submitCode}
              accessibilityRole="button"
              style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
            >
              <Text style={fieldStyles.buttonLabel}>확인</Text>
            </Pressable>
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  locked: { backgroundColor: '#F9FAFB', color: '#6B7280' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  changeLink: { fontSize: 12, color: '#6B7280', textDecorationLine: 'underline' },
});
