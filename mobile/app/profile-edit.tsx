import { formatBirthDate } from '@cuddle/shared';
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
import { Field, fieldStyles } from '@/components/signup/field';
import { RegionField } from '@/components/products/region-field';
import { FieldLabel } from '@/components/ui/field-label';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors } from '@/constants/colors';
import { useMe } from '@/hooks/use-me';
import { changePassword, PasswordChangeRejectedError } from '@/lib/password';
import { updateMe } from '@/lib/profile';
import { checkNicknameAvailable } from '@/lib/signup/api';
import { validateNickname } from '@/lib/signup/validation';
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
//
// ⚠️ **중복체크 단추는 늘 보인다**(웹 `ProfileUpdateBaseForm.tsx:313-327`과 같다).
//    고쳤을 때만 띄우면 「닉네임은 고칠 수 있는 값」이라는 것 자체가 안 보인다.
//    **확인을 요구하는 것만** 고쳤을 때로 가른다 — 사진만 바꾸러 온 사람에게
//    안 고친 닉네임의 중복체크를 시킬 이유가 없다.
//
// ⚠️ **저장 단추를 회색으로 죽이지 않는다.** 회색 단추는 왜 안 눌리는지 말해줄 자리가 없다.
//    늘 같은 모양으로 두고, 눌렀을 때 막힌 이유를 말해준다. 웹도 그렇다(같은 파일 383-389).

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();

  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [region, setRegion] = useState({ sido: '', gugun: '' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | undefined>(undefined);
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

  const 다듬은닉네임 = nickname.trim();
  const 다듬은소개글 = introduction.trim() || null;
  /** 지금 내 닉네임 그대로다 — 확인할 것이 없다 */
  const 닉네임그대로 = 다듬은닉네임 === (me?.nickname ?? '');

  // 「기본 정보」 안의 넷을 다 본다. 하나라도 빠지면 그것만 바꾼 사람이
  // 「변경사항이 없습니다」를 만난다.
  // ⚠️ 소개글은 **다듬은 값끼리** 견준다. 서버는 없으면 null 을 주는데 입력칸은 '' 이라,
  //    그냥 견주면 소개글 없는 사람이 늘 「바뀌었다」로 잡힌다
  const 바뀐값없음 =
    Boolean(me) &&
    닉네임그대로 &&
    다듬은소개글 === (me?.introduction ?? null) &&
    imageUrl === (me?.profileImageUrl ?? null) &&
    region.sido === (me?.addressSido ?? '') &&
    region.gugun === (me?.addressGugun ?? '');

  const changeNickname = (value: string) => {
    setNickname(value);
    setNicknameError(undefined);
    // 고치면 확인이 무효가 된다. 안 그러면 확인한 적 없는 닉네임으로 저장된다
    // (social-signup.tsx:113과 같은 이유).
    setNicknameChecked(false);
  };

  const checkNickname = async () => {
    // ⚠️ **내 닉네임은 서버에 안 물어본다.** 그 API 는 누가 묻는지 모른다
    //    (`AuthController.java:580` — 토큰을 안 받는다). 그대로 물으면 내 것인데도
    //    「이미 사용 중」이라고 답한다
    if (닉네임그대로) {
      setNicknameError(undefined);
      setNicknameChecked(true);
      return;
    }

    const problem = validateNickname(nickname);
    if (problem) {
      setNicknameError(problem);
      return;
    }

    try {
      const available = await checkNicknameAvailable(다듬은닉네임);
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

  const save = async () => {
    if (!me || saving) return;

    const problem = validateNickname(nickname);
    if (problem) {
      setNicknameError(problem);
      return;
    }
    // ⚠️ 안 고친 닉네임은 그냥 통과시킨다 — 이미 내 것이라 남과 겹칠 리 없다
    if (!닉네임그대로 && !nicknameChecked) {
      setNicknameError('닉네임 중복체크를 완료해주세요.');
      return;
    }
    if (바뀐값없음) {
      // 문구는 웹 그대로다(ProfileUpdateBaseForm.tsx:156-163)
      showToast('변경사항이 없습니다. 수정할 내용을 입력해주세요.');
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
        introduction: 다듬은소개글,
      });
      // ⚠️ **✓ 문구를 여기서 지운다.** 바로 아래에서 내 정보를 다시 받아오면 방금 고친
      //    닉네임이 「내 닉네임」이 되면서 `닉네임그대로` 가 뒤집힌다. 확인 표시를 남겨 두면
      //    문구가 「지금 사용 중인…」으로 **갈아타는 게 눈에 보인 채로** 화면이 닫힌다.
      //    ✓ 는 「이 닉네임을 써도 되나」의 답이고, 그 질문은 저장으로 끝났다
      setNicknameChecked(false);
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

          {/* ── 못 고치는 값 ──────────────────────────── */}
          {/* 웹은 늘 보여 줬는데 앱에만 없었다. 앱에는 이걸 볼 수 있는 곳이 아예 없어서
              내가 어떤 이메일로 가입했는지도 확인할 길이 없었다 */}
          {/* ⚠️ **이름·생년월일은 나란히, 이메일은 한 줄 통째로.** 웹과 같은 짜임이다
              (ProfileUpdateBaseForm 의 이름·생년월일 행). 셋을 다 세로로 쌓으면 짧은 값
              둘이 화면을 길게 잡아먹어 정작 고칠 칸이 아래로 밀린다.
              이메일만 따로 두는 이유: 주소가 길어 반 폭에서는 잘린다 */}
          <View style={styles.readOnlyPair}>
            <ReadOnlyRow label="이름" value={me?.name} grow />
            {/* ⚠️ 서버 값(1996-02-17)을 그대로 내보내지 않는다. 웹과 **같은 함수**를 써서
                같은 모양으로 그린다 — 예전에는 웹만 바꿔 그려 같은 값이 달라 보였다 */}
            <ReadOnlyRow label="생년월일" value={formatBirthDate(me?.birthDate)} grow />
          </View>
          <ReadOnlyRow label="이메일" value={me?.email} />
          {/* ⚠️ **값을 나열하지 않는다.** 「이름·생년월일·이메일은…」이라고 부르면 화면이
              바뀔 때 조용히 거짓말이 된다 — 웹에서 실제로 그랬다(데스크탑에는 이메일이
              안 보이는데 이메일도 못 고친다고 말하고 있었다). 가리키는 값 **바로 위**에
              있으니 「위 정보」로 충분하다. 웹도 자리를 여기로 옮겨 같은 문구를 쓴다.
              두 줄로 나눈다 — 「무엇이 안 되나」와 「그럼 어떻게 하나」는 다른 이야기라
              한 줄로 이으면 폰의 좁은 폭에서 한 덩어리로 뭉쳐 읽힌다 */}
          <View style={styles.notice}>
            <Text style={styles.noticeLine}>위 정보는 변경할 수 없습니다.</Text>
            <Text style={styles.noticeLine}>변경이 필요하면 고객센터 1:1 문의로 알려주세요.</Text>
          </View>

          <Field
            label="닉네임"
            value={nickname}
            onChangeText={changeNickname}
            placeholder="cuddle market"
            // 2~10자. 웹과 같은 규칙이다(authValidationRules.ts 의 profileValidationRules.nickname)
            maxLength={10}
            error={nicknameError}
            success={
              nicknameChecked
                ? 닉네임그대로
                  ? '✓ 지금 사용 중인 닉네임이에요.'
                  : '✓ 사용할 수 있는 닉네임이에요.'
                : undefined
            }
            trailing={
              <Pressable
                onPress={() => void checkNickname()}
                accessibilityRole="button"
                style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonPressed]}
              >
                <Text style={fieldStyles.buttonLabel}>중복체크</Text>
              </Pressable>
            }
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
            // ⚠️ 200자에서 **조용히 안 써진다.** 폰에서는 「키보드가 먹통인가」로 읽힌다.
            //    웹도 늘 세어 보여줬다(ProfileUpdateBaseForm.tsx:360)
            hint={`${introduction.length}/200자`}
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
 * 못 고치는 값 한 줄. 이름·생년월일·이메일이 이 모양이다.
 *
 * ⚠️ **입력칸으로 그리지 않는다.** 테두리 있는 칸으로 두면 고칠 수 있는 줄 알고 눌러 보게
 *    된다. 웹도 회색 글자로만 그린다(`ProfileUpdateBaseForm.tsx` 의 `bg-primary-50/50`).
 *
 * ⚠️ **값이 없으면 줄 자체를 안 그린다.** 소셜로 갓 들어온 사람은 생년월일이 없는데
 *    (`birthDate` 가 null), 빈 회색 칸을 그리면 「고장났나」로 보인다.
 */
function ReadOnlyRow({
  label,
  value,
  grow,
}: {
  label: string;
  value?: string | null;
  /** 나란히 놓을 때 반씩 나눠 갖는다. 짝이 없으면(값이 하나뿐이면) 혼자 다 차지한다 */
  grow?: boolean;
}) {
  if (!value) return null;

  return (
    <View style={[styles.readOnlyRow, grow && styles.grow]}>
      <FieldLabel text={label} />
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyValue}>{value}</Text>
      </View>
    </View>
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
  container: { flex: 1, backgroundColor: colors.surface },
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
    color: colors.onSurface,
  },
  readOnlyRow: { gap: 6 },
  // 이름·생년월일을 나란히. 12은 웹의 모바일 폭에서 쓰는 간격과 같다(gap-3)
  readOnlyPair: { flexDirection: 'row', gap: 12 },
  grow: { flex: 1 },
  // 웹의 bg-primary-50/50 자리다. 입력칸(흰 바탕·진한 테두리)과 **일부러 다르게** 보이게 해서
  // 눌러도 소용없다는 게 눈에 먼저 들어오게 한다
  readOnlyBox: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceCream,
  },
  readOnlyValue: {
    fontSize: 15,
    // ⚠️ 400(보통 굵기)이다. 500 이었는데 한 단계 낮췄다 — 고칠 수 있는 칸의 글자보다
    //    가벼워야 「읽기만 하는 값」이라는 게 굵기로도 드러난다
    fontWeight: '400',
    // 웹 text-gray-400 과 같은 결. 「읽는 값」이라 본문보다 물러나 있다
    color: colors.onSurfaceSubtle,
  },
  notice: { gap: 2 },
  noticeLine: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
    lineHeight: 19,
  },
  // 두 묶음 사이에 선을 그어 다른 일이라는 게 보이게 한다
  passwordSection: {
    marginTop: 12,
    paddingTop: 24,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  // 19바퀴(#786)에 갈색에서 먹색으로 옮겼다 — 이 화면을 끝내는 단추라
  // 로그인·가입·신고와 같은 자리에 있다. 갈색은 「여럿 중 고른 것」에 쓴다.
  primaryButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onAction,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  pressed: { opacity: 0.7 },
});
