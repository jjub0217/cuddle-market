import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextInputProps } from 'react-native';

import { colors } from '@/constants/colors';
import type { useSignupForm } from '@/lib/signup/use-signup-form';
import { Field, fieldStyles, messageStyles } from './field';

// 이메일 인증 영역. 상태가 셋이다.
//   ① idle      이메일 칸 + [인증받기]
//   ② sent      이메일 칸(잠김) + [재발송] + 인증코드 칸 + [확인] + 남은 시간
//   ③ verified  이메일 칸(잠김) + "✓ 인증 완료" + [이메일 변경]
//
// 코드를 보낸 뒤부터 칸을 잠근다. 받은 코드는 그때 그 주소의 것이라, 주소를 고칠 수
// 있으면 「인증한 주소」와 「가입하는 주소」가 어긋난다. 서버는 가입 시점에 주소로
// 인증 기록을 찾으므로 그대로 두면 가입이 막힌다(설계 §6·§7).
//
// 인증이 끝나면 재발송 버튼도 없앤다 — 재발송하면 서버가 기존 인증 기록을 지운다.
//
// 웹도 같은 규칙이다(src/features/signup/components/EmailValidCode.tsx).

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
  const locked = verification !== 'idle';

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
        editable={!locked}
        style={locked ? styles.locked : undefined}
        // 아직 안 보냈을 때만. 보내고 나면 아래 줄(「이 주소로 코드를 보냈어요」)이
        // 그 자리를 대신한다 — 둘 다 두면 「보내드려요」와 「보냈어요」가 나란히 남는다.
        // 웹도 단계마다 한 줄만 보여준다 — `EmailValidCode.tsx` 의 `emailHelperText`.
        hint={locked ? undefined : '사용 가능 여부를 확인한 뒤 인증코드를 보내드려요.'}
        trailing={
          verified ? null : (
            <Pressable
              onPress={form.sendCode}
              // 보내는 동안 또 누르면 코드가 두 번 나가고 뒤엣것만 유효해진다
              disabled={form.sendingCode}
              accessibilityRole="button"
              style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
            >
              {form.sendingCode ? (
                <ActivityIndicator size="small" color={colors.onSurface} />
              ) : (
                <Text style={fieldStyles.buttonLabel}>
                  {verification === 'sent' ? '재발송' : '인증받기'}
                </Text>
              )}
            </Pressable>
          )
        }
      />

      {locked ? (
        <View style={styles.verifiedRow}>
          {verified ? (
            <Text style={messageStyles.success}>✓ 이메일 인증이 완료되었어요.</Text>
          ) : (
            <Text style={messageStyles.hint}>이 주소로 코드를 보냈어요.</Text>
          )}
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
          // ⚠️ 1분을 남기면 붉게 바꾼다. 회색으로만 두면 곧 만료된다는 걸 못 알아채고,
          //    코드를 다 넣은 뒤에야 「만료됐다」는 말을 듣게 된다.
          hintTone={secondsLeft < 60 ? 'danger' : 'muted'}
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
  locked: { backgroundColor: colors.surfaceMuted, color: colors.onSurfaceMuted },
  // 이 줄은 **칸의 안내문 자리**에 놓여야 한다. wrap의 gap이 16이라 그대로 두면
  // 입력칸에서 너무 멀어진다 — Field가 자기 안내문을 두는 거리(6)에 맞춘다.
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  // 옆에 나란히 서는 안내 문구(messageStyles.hint)와 같은 크기다.
  // 링크라는 건 밑줄이 알려 주니 크기까지 다를 이유가 없다.
  changeLink: { fontSize: 13, color: colors.onSurfaceMuted, textDecorationLine: 'underline' },
});
