import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { InvalidCredentialsError, login } from '@/lib/auth/session';

// 로그인 폼. 화면(app/login.tsx)과 분리해 둔다 —
// 소셜 바퀴에서 "방법 고르기 → 이메일 폼" 2단계로 쪼갤 때 이 조각을 그대로 옮긴다.
//
// 입력이 두 개뿐이라 폼 라이브러리(react-hook-form)를 새로 들이지 않고 손으로 검증한다.

interface Props {
  /** 로그인에 성공했을 때. 보통 화면을 닫는다. */
  onSuccess: () => void;
}

/** 아주 단순한 형태 검사. 진짜 존재하는 주소인지는 서버가 판단한다. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm({ onSuccess }: Props) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;

    if (!looksLikeEmail(email)) {
      setError('이메일 주소를 올바르게 입력해주세요.');
      return;
    }
    if (password.length === 0) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);

      // 비로그인 상태로 받아온 상품에는 isFavorite이 비어 있다.
      // 다시 받아야 하트가 채워진다(설계 §7.1).
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      onSuccess();
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        setError('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else if (err instanceof TypeError) {
        // fetch가 네트워크 자체에 실패하면 TypeError를 던진다.
        setError('인터넷 연결을 확인해주세요.');
      } else {
        setError('잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>이메일로 로그인하기</Text>

      <View style={styles.field}>
        <Text style={styles.label}>이메일 주소</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          placeholder="example@cuddle.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) setError(null);
          }}
          placeholder="비밀번호"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
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
          <Text style={styles.submitLabel}>로그인</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  input: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  // 회원가입 화면과 같은 값 — 웹 토큰(--color-danger-500)에서 가져왔다.
  error: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C91D1D',
  },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  submitPressed: {
    opacity: 0.8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
