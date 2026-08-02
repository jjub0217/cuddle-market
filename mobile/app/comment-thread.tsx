import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
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

import { CommentInput, type ReplyTarget } from '@/components/community/comment-input';
import { CommentList } from '@/components/community/comment-list';
import { CommentMenuSheet } from '@/components/community/comment-menu-sheet';
import { useAuthStore } from '@/lib/auth/store';
import { createComment, fetchComments, type CommentItem } from '@/lib/community';
import { showToast } from '@/lib/toast';

// 댓글 하나와 그 답글만 보는 화면.
//
// 왜 루트 스택인가: 하단에 답글 칸이 늘 열려 있어 탭바까지 있으면 아래가 두 겹이
// 된다. 9바퀴 신고 화면이 같은 판단을 했다("루트 스택에 둔다 — 탭바까지 덮어야 한다").
// 웹도 이 화면에서는 하단 탭바를 숨긴다.
//
// 칸은 **늘 열려 있고 대상만 바뀐다** — 규칙 다섯은 계획서 앞부분에 적어 뒀다.

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값

export default function CommentThreadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { postId: postIdParam, commentId: commentIdParam } = useLocalSearchParams<{
    postId: string;
    commentId: string;
  }>();
  const postId = Number(postIdParam);
  const commentId = Number(commentIdParam);

  const scrollRef = useRef<ScrollView>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  /** ⋮ 를 연 댓글. 시트와 삭제 확인 창이 같이 쓴다 */
  const [menuTarget, setMenuTarget] = useState<CommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 상세와 **같은 키**를 쓴다 — 이미 받아 둔 목록을 그대로 쓰고(요청이 안 늘어난다),
  // 여기서 단 답글이 상세에도 바로 보인다. CommentList도 이 키를 쓴다.
  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });
  const comment = comments?.find((item) => item.id === commentId);

  /** 대상을 안 골랐으면 이 스레드에 단다 */
  const targetId = replyTo?.commentId ?? commentId;

  const handleReply = (target: CommentItem) => {
    // 이미 그 대상이면 이 스레드로 되돌린다(웹 openReplyForm과 같다).
    // 칸은 안 닫는다 — 닫히면 답글을 달 길이 없어진다.
    setReplyTo(
      targetId === target.id ? null : { commentId: target.id, nickname: target.authorNickname }
    );
    // 답글이 많으면 지금 답하는 자리가 화면 밖이다. 눌러도 아무 일도 안 일어난 것처럼
    // 보이므로 목록 끝으로 내린다 (웹의 scrollIntoView 자리). 초점은 칸이 스스로 잡는다.
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleSubmit = async (content: string): Promise<boolean> => {
    // 게스트면 로그인부터. 쓴 글은 지우지 않는다(false를 돌려준다).
    if (useAuthStore.getState().status !== 'authed') {
      router.push('/login');
      return false;
    }

    setSubmitting(true);
    try {
      await createComment(postId, content, targetId);
      // 칸을 닫지 않는다. 대상만 이 스레드로 되돌린다 —
      // 닫히면 답글을 달 길이 없어진다.
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : '답글 등록에 실패했습니다.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
        {/* 원 댓글은 빼고 답글 수만. 서버 commentCount는 글 전체 수라 여기 쓸 수 없다 */}
        <Text style={styles.heading}>답글 {comment?.childrenCount ?? 0}</Text>
      </View>

      {/* 목록과 입력칸을 **함께** 밀어 올린다. 입력칸만 감싸면 키보드가 칸을 덮는다
          (로그인 화면과 같은 방식이다). 안드로이드는 창이 저절로 줄어 안 준다. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {comments && !comment ? (
            <Text style={styles.notFound}>댓글을 찾을 수 없어요.</Text>
          ) : (
            <CommentList
              postId={postId}
              onlyParentId={commentId}
              // ⋮ — 내 댓글이면 삭제, 남의 댓글이면 작성자 신고.
              onMenu={setMenuTarget}
              // 여기서는 부모든 답글이든 화면을 안 옮긴다. 이미 그 스레드 안이다.
              onReply={handleReply}
            />
          )}
        </ScrollView>

        <CommentInput
          replyTo={replyTo}
          isThread
          onSubmit={handleSubmit}
          onCancelReply={() => setReplyTo(null)}
          submitting={submitting}
          onRequestLogin={() => router.push('/login')}
          // 답글이 많으면 칸이 화면 밖이다. 누른 자리를 보여 준다.
          onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
        />
      </KeyboardAvoidingView>

      <CommentMenuSheet
        postId={postId}
        target={menuTarget}
        onClose={() => setMenuTarget(null)}
        onDeleted={(comment) => {
          // 이 스레드의 원 댓글을 지웠으면 볼 게 없다. 「댓글을 찾을 수 없어요.」만 남은
          // 화면에 세워 두지 말고 상세로 되돌린다. 답글을 지웠으면 그대로 머문다.
          if (comment.id === commentId) router.back();
        }}
      />
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
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  notFound: { paddingVertical: 40, textAlign: 'center', fontSize: 14, color: '#9CA3AF' },
  pressed: { opacity: 0.6 },
});
