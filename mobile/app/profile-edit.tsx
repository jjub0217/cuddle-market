import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileImageField } from '@/components/my/profile-image-field';
import { Field } from '@/components/signup/field';
import { RegionField } from '@/components/products/region-field';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMe } from '@/hooks/use-me';
import { changePassword, PasswordChangeRejectedError } from '@/lib/password';
import { updateMe } from '@/lib/profile';
import { showToast } from '@/lib/toast';

// 프로필 수정.
//
// **웹과 같은 한 화면이다**(`ProfileUpdate.tsx:118-120`) — 기본 정보 폼과 비밀번호 폼이
// 각자 제목과 저장 단추를 갖고 세로로 쌓인다. 제목도 웹에서 가져왔다.
//
// ⚠️ **비밀번호 묶음은 `provider` 가 `LOCAL` 일 때만 그린다.** 소셜 계정에는 비밀번호가 없다.
//    웹도 같은 기준이다(`ProfileUpdate.tsx:41`).
//
// ⚠️ **저장할 때 여섯 개를 다 보낸다.** 서버가 전체 교체라 안 보낸 값은 지워진다
//    (`lib/profile.ts` 의 `UpdateMeInput` 설명). 이 화면에서 안 고치는 생년월일도 실어 보낸다.

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();

  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [region, setRegion] = useState({ sido: '', gugun: '' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 내 정보를 받아오면 칸을 채운다. 「지금 값에서 고치는」 화면이라 빈 칸으로 두면 안 된다.
  useEffect(() => {
    if (!me) return;
    setNickname(me.nickname ?? '');
    setIntroduction(me.introduction ?? '');
    setRegion({ sido: me.addressSido ?? '', gugun: me.addressGugun ?? '' });
    setImageUrl(me.profileImageUrl);
  }, [me]);

  const isSocial = Boolean(me?.provider) && me?.provider !== 'LOCAL';

  const save = async () => {
    if (!me || saving) return;
    const 다듬은닉네임 = nickname.trim();
    if (!다듬은닉네임) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateMe({
        nickname: 다듬은닉네임,
        // ⚠️ 이 화면에서 안 고치는 값. 안 보내면 서버가 지운다
        birthDate: me.birthDate ?? '',
        addressSido: region.sido,
        addressGugun: region.gugun,
        profileImageUrl: imageUrl,
        introduction: introduction.trim() || null,
      });
      // 마이 화면·판매자 프로필이 같은 열쇠를 본다. 무르게 해서 새 값을 받게 한다
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      showToast('저장했어요.');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 문제가 발생했어요.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="프로필 수정" />
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="프로필 수정" />
      {/* ⚠️ 안드로이드도 padding 을 준다. edgeToEdgeEnabled 라 창이 안 줄고 앱이 키보드
          뒤까지 그린다(mobile/AGENTS.md) */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* ── 기본 정보 ─────────────────────────────── */}
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <ProfileImageField url={imageUrl} nickname={nickname} onChange={setImageUrl} />

          <Field
            label="닉네임"
            value={nickname}
            onChangeText={setNickname}
            placeholder="cuddle market"
            maxLength={20}
          />

          <RegionField
            label="지역"
            sido={region.sido}
            gugun={region.gugun}
            onChange={(sido, gugun) => setRegion({ sido, gugun })}
          />

          <Field
            label="소개글"
            value={introduction}
            onChangeText={setIntroduction}
            placeholder="소개글을 작성해주세요"
            multiline
            numberOfLines={4}
            maxLength={200}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            testID="profile-save"
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || saving) && styles.pressed,
            ]}
          >
            <Text style={styles.primaryLabel}>{saving ? '저장 중…' : '저장'}</Text>
          </Pressable>

          {/* ── 비밀번호 변경 ──────────────────────────── */}
          {/* ⚠️ 소셜 계정에는 비밀번호가 없다. 아예 안 그린다 */}
          {!isSocial ? <PasswordSection /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * 비밀번호 변경 묶음.
 *
 * 기본 정보와 **저장이 따로**다 — 서버 경로가 다르기 때문이다
 * (`PATCH /auth/password/change` vs `PATCH /profile/me`).
 */
function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (saving) return;
    if (!current || !next || !confirm) {
      setError('모든 칸을 입력해주세요.');
      return;
    }
    if (next !== confirm) {
      // 서버도 확인하지만 여기서 먼저 막는다 — 굳이 다녀올 이유가 없다
      setError('새 비밀번호가 서로 달라요.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await changePassword({
        currentPassword: current,
        newPassword: next,
        // ⚠️ 확인용도 서버로 보낸다. 앱에서만 맞춰보고 빼면 400 이 난다
        confirmPassword: confirm,
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      showToast('비밀번호를 변경했어요.');
    } catch (err) {
      // 서버가 이유를 줬으면 그대로 보여준다 — 「현재 비밀번호가 일치하지 않습니다」 같은 것
      if (err instanceof PasswordChangeRejectedError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : '변경 중 문제가 발생했어요.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.passwordSection}>
      <Text style={styles.sectionTitle}>비밀번호 변경</Text>

      <Field
        label="현재 비밀번호"
        value={current}
        onChangeText={setCurrent}
        placeholder="현재 비밀번호를 입력하세요"
        secureTextEntry
      />
      <Field
        label="새 비밀번호"
        value={next}
        onChangeText={setNext}
        placeholder="새 비밀번호를 입력하세요"
        secureTextEntry
      />
      <Field
        label="새 비밀번호 확인"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="새 비밀번호를 다시 입력하세요"
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        testID="password-save"
        onPress={submit}
        disabled={saving}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primaryButton, (pressed || saving) && styles.pressed]}
      >
        <Text style={styles.primaryLabel}>{saving ? '변경 중…' : '비밀번호 변경'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  // 제목은 웹에서 가져왔다 — ProfileUpdateBaseForm.tsx:217 · ProfileUpdatePasswordForm.tsx:110
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  // 두 묶음 사이에 선을 그어 다른 일이라는 게 보이게 한다
  passwordSection: {
    marginTop: 12,
    paddingTop: 24,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#825500',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
  },
  pressed: { opacity: 0.7 },
});
