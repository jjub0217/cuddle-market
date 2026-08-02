import { getTimeAgo } from '@cuddle/shared';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommentList } from '@/components/community/comment-list';
import { PostBody } from '@/components/community/post-body';
import { ErrorState, LoadingState } from '@/components/list-states';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { useMe } from '@/hooks/use-me';
import { fetchPostDetail } from '@/lib/community';

// 게시글 상세. 읽기만 한다 — 고치기·지우기는 12바퀴다.
//
// 댓글은 Task 10에서 이 화면 안에 전부 그린다. 여기서는 글만 그린다.

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const { data: me } = useMe();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  /** ⋮ 는 신고 하나뿐이다. 차단은 프로필 쪽에 있고, 글 지우기는 12바퀴다 */
  const sheetActions: SheetAction[] = post
    ? [
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
      ]
    : [];

  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError || !post) {
      return <ErrorState onRetry={() => refetch()} title="게시글을 불러오지 못했어요." />;
    }

    return (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{post.title}</Text>

        <Pressable
          style={({ pressed }) => [styles.author, pressed && styles.pressed]}
          onPress={() => router.push(`/(tabs)/(community)/users/${post.authorId}`)}
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

          {/* 「답글 달기」·⋮ 는 아직 갈 데가 없다 — 스레드 화면은 11바퀴, ⋮ 는 12바퀴다 */}
          <CommentList postId={postId} />
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
          <ChevronLeft size={26} color="#111827" />
        </Pressable>

        {/* 내 글에는 ⋮ 를 안 그린다 — 나를 신고할 이유가 없다 */}
        {post && !isMine ? (
          <Pressable
            onPress={() => setIsSheetOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="더보기"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <EllipsisVertical size={24} color="#111827" />
          </Pressable>
        ) : null}
      </View>

      {renderBody()}

      <ProductActionSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        actions={sheetActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  body: { paddingBottom: 32 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  author: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, color: '#6B7280' },
  meta: { fontSize: 13, color: '#6B7280' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginBottom: 16 },
  comments: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  commentsHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentsTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  commentsCount: { fontSize: 15, fontWeight: '600', color: '#825500' }, // 웹 --color-primary-container
  pressed: { opacity: 0.6 },
});
