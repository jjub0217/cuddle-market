import { getTimeAgo } from '@cuddle/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommentInput } from '@/components/community/comment-input';
import { CommentList } from '@/components/community/comment-list';
import { CommentMenuSheet } from '@/components/community/comment-menu-sheet';
import { PostBody } from '@/components/community/post-body';
import { ErrorState, LoadingState } from '@/components/list-states';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { colors } from '@/constants/colors';
import { useMe } from '@/hooks/use-me';
import { useAuthStore } from '@/lib/auth/store';
import { createComment, fetchPostDetail, type CommentItem } from '@/lib/community';
import { deletePost } from '@/lib/community-post';
import { showToast } from '@/lib/toast';

// 게시글 상세. 글 읽기 + 댓글 읽기·쓰기 + 내 글 고치기·지우기.
//
// 맨 아래 칸은 **글에 새 댓글**을 단다. 답글은 여기서 안 단다 —
// 부모 댓글의 「답글 달기」를 누르면 스레드 화면(app/comment-thread.tsx)으로 옮겨 간다.

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  /** ⋮ 를 연 댓글. 시트와 삭제 확인 창이 같이 쓴다 */
  const [menuTarget, setMenuTarget] = useState<CommentItem | null>(null);
  /** 글 삭제 확인 창을 열었는가 */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['communityPost', postId],
    queryFn: () => fetchPostDetail(postId),
  });

  const isMine = Boolean(me && post && me.id === post.authorId);

  /**
   * 헤더 ⋮ 는 내 글이냐로 갈린다 — 내 글이면 고치기·지우기, 남의 글이면 신고.
   * (차단은 여기 없다. 프로필 쪽에 있다)
   *
   * ⚠️ 내 글에 신고를 두면 안 된다 — 나를 나에게 신고하는 자리가 된다.
   *    댓글 ⋮ 와 같은 갈래다(lib/comment-menu.ts).
   */
  const sheetActions: SheetAction[] = !post
    ? []
    : isMine
      ? [
          {
            label: '게시글 수정',
            onPress: () => {
              setIsSheetOpen(false);
              // 수정 화면은 따로 없다. 글쓰기 화면이 postId 를 받으면 수정 모드가 된다.
              router.push({
                pathname: '/community-post',
                params: { postId: String(postId) },
              });
            },
          },
          {
            label: '게시글 삭제',
            tone: 'danger',
            onPress: () => {
              // 시트를 먼저 닫는다. 확인 창과 겹쳐 뜨지 않게(댓글 ⋮ 와 같은 순서).
              setIsSheetOpen(false);
              setIsDeleteOpen(true);
            },
          },
        ]
      : [
          {
            label: '게시글 신고하기',
            onPress: () => {
              setIsSheetOpen(false);
              router.push({
                pathname: '/report',
                params: { kind: 'post', id: String(postId), name: post.title },
              });
            },
          },
        ];

  /** 글 지우기. 지운 뒤에는 목록을 무르게 하고 왔던 곳으로 돌아간다 */
  const handleDeletePost = async () => {
    try {
      await deletePost(postId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '게시글 삭제에 실패했습니다.');
      // ⚠️ **창을 닫지 않고 그냥 돌아간다.** 닫히면 다시 시도할 길이 없다.
      //    ConfirmDialog 는 스스로 안 닫는다 — 아래 setIsDeleteOpen(false) 를 지나쳐야 열려 있다.
      //
      //    채팅방 나가기(app/chat/[id].tsx 의 handleLeave)는 여기서 throw 를 쓰는데,
      //    그러면 아무도 안 받는 거절이 되어 시험이 그것을 실패로 집는다. 창이 열려 있는
      //    것은 어차피 「안 닫는 것」이 만드는 결과라 던질 이유가 없다.
      return;
    }

    setIsDeleteOpen(false);
    // ⚠️ 안 무르게 하면 캐시에 든 옛 목록에 지운 글이 그대로 남는다(#922 와 같은 일).
    await queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    // 댓글 삭제와 같은 말투다(comment-menu-sheet.tsx 의 「댓글을 삭제했습니다」).
    showToast('게시글을 삭제했습니다');
    router.back();
  };

  /** 글에 새 댓글. 등록됐으면 true — false면 칸이 쓴 글을 안 지운다 */
  const handleCreateComment = async (content: string): Promise<boolean> => {
    if (useAuthStore.getState().status !== 'authed') {
      router.push('/login');
      return false;
    }

    setSubmitting(true);
    try {
      await createComment(postId, content);
      // 댓글 수는 서버가 준 commentCount를 쓴다. 상세를 다시 받아 맞춘다.
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : '댓글 등록에 실패했습니다.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError || !post) {
      return <ErrorState onRetry={() => refetch()} title="게시글을 불러오지 못했어요." />;
    }

    return (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{post.title}</Text>

        <Pressable
          style={({ pressed }) => [styles.author, pressed && styles.pressed]}
          // ⚠️ 내 글이면 마이 탭으로 보낸다. users/[id] 는 남의 프로필을 보는 자리라
          //    내 id 로 들어가면 「내 상품 관리」도 없는 반쪽 화면이 뜬다.
          //    상품 상세의 판매자 카드(seller-card.tsx)와 같은 규칙이다(#869).
          //    ⚠️ 웹은 화면 안에서 한 번에 막지만(UserPage 의 리다이렉트), 앱은 그런 문이
          //       없어 **들어오는 길마다** 막아야 한다.
          onPress={() =>
            me && post.authorId === me.id
              ? router.push('/(tabs)/(my)')
              : router.push(`/(tabs)/(community)/users/${post.authorId}`)
          }
          accessibilityRole="button"
          accessibilityLabel={`${post.authorNickname}님의 프로필`}
        >
          {post.authorProfileImageUrl ? (
            <Image source={{ uri: post.authorProfileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{post.authorNickname.slice(0, 1)}</Text>
            </View>
          )}
          <Text style={styles.meta}>
            {post.authorNickname} · {getTimeAgo(post.createdAt)} · 조회 {post.viewCount}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        {/* 이미지는 본문 안에 있다. imageUrls를 또 그리면 두 번 나온다 */}
        <PostBody content={post.content} />

        {/* 댓글은 상세 안에 전부 펼친다. 「댓글 N ›」 줄만 두면 대화가 있는지조차
            안 보인다 — 웹을 그렇게 만들어 보고 바꿨다. */}
        <View style={styles.comments}>
          <View style={styles.commentsHead}>
            <Text style={styles.commentsTitle}>댓글</Text>
            <Text style={styles.commentsCount}>{post.commentCount}</Text>
          </View>

          <CommentList
            postId={postId}
            // ⋮ — 내 댓글이면 삭제, 남의 댓글이면 작성자 신고.
            onMenu={setMenuTarget}
            onReply={(comment) =>
              // 상세에서는 답글을 안 단다. 부모든 답글이든 그 **부모의 스레드**로 옮긴다 —
              // 거기서 대상을 고르면 된다. 서버가 답글을 평평하게 주므로 답글의
              // parentId가 또 답글일 수 있지만, 스레드는 언제나 부모 기준이다.
              router.push({
                pathname: '/comment-thread',
                params: {
                  postId: String(postId),
                  commentId: String(comment.parentId ?? comment.id),
                },
              })
            }
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={({ pressed }) => (pressed ? styles.pressed : undefined)}
        >
          <ChevronLeft size={26} color={colors.onSurface} />
        </Pressable>

        {/* 내 글에도 ⋮ 를 그린다. 안에 든 것이 갈릴 뿐이다(위 sheetActions).
            예전에는 내 글에 아예 안 그렸다 — 할 수 있는 일이 신고뿐이었기 때문이다 */}
        {post ? (
          <Pressable
            onPress={() => setIsSheetOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="더보기"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <EllipsisVertical size={24} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>

      {/* 본문과 입력칸을 **함께** 밀어 올린다. 입력칸만 감싸면 키보드가 칸을 덮는다.
          ⚠️ 안드로이드에도 'padding'을 준다. 「안드로이드는 창이 저절로 줄어 안 줘도
             된다」는 옛말이다 — app.json의 edgeToEdgeEnabled가 켜져 있으면 창이 안 줄고
             앱이 키맵 뒤까지 그린다. 실기기에서 화면이 통째로 안 밀렸다(2026-08-02).
             로그인 화면은 바닥에 붙은 칸이 없어 이 차이가 안 보였다. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {renderBody()}

        {/* 글이 안 떴으면 댓글 칸도 안 그린다. 탭 안이라 이 칸 아래에 탭바가 온다 —
            웹도 같은 모양이다(레이아웃이 탭바 높이를 비켜 준다). */}
        {post ? (
          <CommentInput
            replyTo={null}
            onSubmit={handleCreateComment}
            onCancelReply={() => {}}
            submitting={submitting}
            onRequestLogin={() => router.push('/login')}
            // 키보드가 올라오면 창이 좁아지는데 댓글은 아래에 있어 밀려난다.
            // 칸을 누른 까닭은 댓글을 쓰려는 것이니 그 자리로 따라간다.
            onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
          />
        ) : null}
      </KeyboardAvoidingView>

      <ProductActionSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        actions={sheetActions}
      />

      <CommentMenuSheet
        postId={postId}
        target={menuTarget}
        onClose={() => setMenuTarget(null)}
      />

      <ConfirmDialog
        visible={isDeleteOpen}
        // 문구는 웹 DeletePostConfirmModal 그대로다(47줄 제목·설명 · 59줄 단추).
        // 단추가 「삭제」가 아니라 「삭제하기」인 것도 웹과 같은 값이다 —
        // 앱의 댓글 삭제 확인 창도 「삭제하기」다(comment-menu-sheet.tsx).
        heading="게시글 삭제"
        description="정말로 이 게시글을 삭제하시겠습니까?"
        confirmLabel="삭제하기"
        // 되돌릴 수 없는 일에만 쓴다.
        tone="danger"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeletePost}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  body: { paddingBottom: 32 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  author: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceSunken },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, color: colors.onSurfaceMuted },
  meta: { fontSize: 13, color: colors.onSurfaceMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant, marginBottom: 16 },
  comments: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  commentsHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentsTitle: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  commentsCount: { fontSize: 15, fontWeight: '600', color: colors.accent }, // 웹 --color-primary-container
  pressed: { opacity: 0.6 },
});
