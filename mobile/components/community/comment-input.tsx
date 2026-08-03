import { splitMention } from '@cuddle/shared';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputSelectionChangeEventData,
  View,
} from 'react-native';

import { useAuthStore } from '@/lib/auth/store';

// 댓글·답글을 쓰는 칸.
//
// 스레드 화면에서는 **늘 열려 있고 대상만 바뀐다.** 답글마다 칸이 따로 열리지
// 않는다 — 칸이 여럿이면 어디에 쓰는지 헷갈리고, 화면 밖에 생기면 눌러도
// 아무 일도 안 일어난 것처럼 보인다.
//
// @닉네임은 미리 채우고 지울 수 있게 둔다. 서버에 멘션 필드가 없어 글자에 섞여
// 저장되므로 사용자가 손댈 수 있어야 한다.

export interface ReplyTarget {
  /** 답글이 붙을 댓글 id */
  commentId: number;
  nickname: string;
  /**
   * 그 댓글의 깊이. 서버가 3까지만 받아서 이걸 봐야 한다 —
   * 어디에 달지는 lib/community.ts의 replyParentId가 정한다.
   */
  depth: number;
}

interface CommentInputProps {
  /** 지금 답글을 다는 대상. null이면 이 칸의 기본 대상에 단다 */
  replyTo: ReplyTarget | null;
  /**
   * 이 칸이 **스레드에 답글을 다는** 칸인지.
   *
   * 스레드 화면은 대상을 안 골라도(=replyTo가 null이어도) 답글을 다는 자리다.
   * 안내 문구를 「댓글을…」로 되돌리면 안 되므로 이 값으로 가른다.
   */
  isThread?: boolean;
  /** 등록됐으면 true. false면 쓴 글을 안 지운다 (실패·로그인 필요) */
  onSubmit: (content: string) => Promise<boolean>;
  onCancelReply: () => void;
  submitting: boolean;
  /**
   * 게스트가 칸을 눌렀을 때. 로그인 화면으로 보낸다.
   *
   * 게스트에게는 칸 대신 **글이 안 써지는 단추**를 그린다 — 칸에 「로그인해 주세요」라고
   * 적어 놓고 글이 써지면 말과 행동이 다르다.
   */
  onRequestLogin?: () => void;
  /**
   * 칸에 초점이 갔을 때.
   *
   * 상세 화면이 쓴다: 키보드가 올라오면 창이 좁아지는데 댓글은 **아래**에 있어
   * 밀려난다. 칸을 누른 까닭은 댓글을 쓰려는 것이니 그 자리로 따라가야 한다.
   */
  onFocus?: () => void;
}

export function CommentInput({
  replyTo,
  isThread = false,
  onSubmit,
  onCancelReply,
  submitting,
  onRequestLogin,
  onFocus,
}: CommentInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  /**
   * 커서 자리를 **잠깐만** 붙잡는 값. undefined면 손을 뗀 것이다.
   *
   * ⚠️ 계획서는 `setNativeProps({ selection })`을 썼는데 이 앱은 새 아키텍처
   *    (app.json의 newArchEnabled: true)라 TextInput에서 못 믿는다.
   *    그래서 `selection` prop으로 한 번 옮기고, 그 자리에 닿으면 바로 놓는다 —
   *    계속 붙잡고 있으면 사용자가 커서를 옮길 수 없다.
   */
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  // 대상이 바뀌면 @닉네임을 채우고 바로 칠 수 있게 한다.
  //
  // ⚠️ 커서를 글 **끝**에 둔다. 그냥 초점만 주면 「@협주 」 앞에서 깜빡여서
  //    이어 치면 「안녕@협주 」가 된다 — 멘션이 앞에 있어야 대상을 안다.
  //
  // 대상을 되돌리면(취소·같은 사람 다시 누르기) **@닉네임만** 떼고 쓰던 글은 남긴다.
  // 「협주에게 말고 그냥 이 글타래에 달자」고 누른 것이라, 써 둔 글까지 날리면
  // 되돌릴 수 없는 손해다. 띠의 「취소」도 「이 사람에게 다는 걸 취소」라는 뜻이다.
  //
  // 등록에 성공했을 때도 이 자리를 지나는데, 그때는 handleSubmit이 따로 비운다.
  // 어느 쪽이 먼저 돌든 결과는 빈 칸이다 — 빈 글에서 @를 떼도 빈 글이다.
  //
  // 처음 그릴 때는 replyTo가 null이라 아무 일도 안 한다: 화면에 들어오자마자
  // 초점이 가서 키보드가 튀어 오르면 어리둥절하다.
  useEffect(() => {
    if (!replyTo) {
      setValue((current) => splitMention(current).rest.trimStart());
      return;
    }
    const next = `@${replyTo.nickname} `;
    setValue(next);
    setSelection({ start: next.length, end: next.length });
    inputRef.current?.focus();
  }, [replyTo]);

  /** 부탁한 자리에 커서가 닿았으면 손을 뗀다 */
  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    if (!selection) return;
    const next = event.nativeEvent.selection;
    if (next.start === selection.start && next.end === selection.end) setSelection(undefined);
  };

  const handleChangeText = (text: string) => {
    setValue(text);
    // 사람이 치기 시작하면 커서는 사람 것이다
    if (selection) setSelection(undefined);
  };

  // 맨 앞 @닉네임과 나머지를 가른다. 목록에서 쓰는 것과 같은 함수다
  const { mention, rest } = splitMention(value);

  const handleSubmit = async () => {
    const content = value.trim();
    if (!content || submitting) return;
    // 실패했거나 로그인이 필요해 되돌아온 것이면 쓴 글을 안 지운다
    if (await onSubmit(content)) setValue('');
  };

  const isReplyInput = Boolean(replyTo) || isThread;

  const isGuest = useAuthStore((state) => state.status) !== 'authed';
  const placeholder = isGuest
    ? `${isReplyInput ? '답글' : '댓글'}을 입력하려면 로그인해 주세요`
    : `${isReplyInput ? '답글' : '댓글'}을 입력하세요`;

  // 게스트에게는 **글이 안 써지는 단추**를 준다. 눌러 보면 바로 로그인 화면이다.
  //
  // 왜 다 쓴 뒤가 아니라 지금 막나: 칸에 「로그인해 주세요」라고 적어 놓고 글이 써지면
  // 말과 행동이 다르다. 다 쓴 다음에 끊기는 것이 가장 나쁜 순간이기도 하다.
  //
  // ⚠️ 웹은 「등록」을 눌러야 로그인을 띄운다(CommentList onSubmit). 일부러 다르게 간다 —
  //    웹은 그 자리에 작은 창이 뜨고 뒤 화면이 그대로 보이지만, 앱은 화면이 통째로 넘어간다.
  if (isGuest) {
    return (
      <Pressable
        onPress={onRequestLogin}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        {/* 칸처럼 보이지만 TextInput이 아니다 — 키보드가 떴다가 화면이 넘어가면 어수선하다 */}
        <View style={styles.input}>
          <Text style={styles.guestPlaceholder}>{placeholder}</Text>
        </View>
        <View style={[styles.submit, styles.submitDisabled]}>
          <Text style={styles.submitLabel}>등록</Text>
        </View>
      </Pressable>
    );
  }

  return (
    // ⚠️ 키보드 피하기는 **화면**이 맡는다(로그인 화면과 같은 방식).
    //    여기서 KeyboardAvoidingView로 이 칸만 감쌌더니 키보드가 칸을 덮었다 —
    //    위쪽 목록까지 함께 밀어 올려야 자리가 생긴다.
    <View>
      {/* 칸 하나가 대상만 바꾸므로 누구에게 다는 중인지 알려 준다.
          기본 대상(그 스레드)에 다는 중일 때는 당연한 상태라 안 그린다. */}
      {replyTo ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyLabel}>{replyTo.nickname}님에게 답글 남기는 중</Text>
          <Pressable onPress={onCancelReply} hitSlop={8} accessibilityRole="button">
            <Text style={styles.cancel}>취소</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.bar}>
        {/* 맨 앞 @닉네임만 색을 준다 — 답글 목록의 @닉네임과 같은 색이라야
            같은 것으로 읽힌다(comment-row.tsx의 mention).
            ⚠️ RN에서는 값을 value가 아니라 **children**으로 준다. 그래야 일부만 색을
               입힐 수 있다. 둘을 같이 주면 children이 이긴다. */}
        <TextInput
          ref={inputRef}
          onChangeText={handleChangeText}
          selection={selection}
          onSelectionChange={handleSelectionChange}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          maxLength={1000}
        >
          {mention ? <Text style={styles.mention}>{mention}</Text> : null}
          {/* 맨 글자를 그냥 두면 «Text strings must be rendered within a <Text>»가 난다 */}
          {rest ? <Text>{rest}</Text> : null}
        </TextInput>
        <Pressable
          onPress={handleSubmit}
          disabled={!value.trim() || submitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submit,
            (!value.trim() || submitting) && styles.submitDisabled,
            pressed && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitLabel}>등록</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 진짜 칸의 placeholder와 같은 색·크기로 둔다 — 눌러야 아는 차이여야 한다
  guestPlaceholder: { fontSize: 15, color: '#9CA3AF' },
  // 답글 목록의 @닉네임과 같은 색이다 (comment-row.tsx의 mention · 웹 --color-primary-container)
  mention: { color: '#825500' },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  replyLabel: { fontSize: 13, color: '#6B7280' },
  cancel: { fontSize: 13, fontWeight: '600', color: '#825500' }, // 웹 --color-primary-container
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  submit: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
