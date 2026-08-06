import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/community/post-card';
import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { StatusFilterChips, type FilterChip } from '@/components/my/status-filter-chips';
import { AppHeader } from '@/components/ui/app-header';
import { fetchPosts, type BoardType, type PostListItem } from '@/lib/community';

// 커뮤니티 목록.
//
// 검색·정렬은 이번 바퀴에서 뺐다(설계 §2). 서버는 받지만 읽기+댓글이 목표다.

/**
 * 질문/정보 두 갈래.
 * 글자는 웹 COMMUNITY_TAB(constants.ts)에서 그대로 가져왔다 — 같은 화면을 웹과 앱이
 * 다르게 부르면 안 된다.
 * 마이 목록·판매자 프로필과 같은 칩 조각을 쓴다 — 앱 안에서 「목록 위에서 고르는 줄」이
 * 두 모양이면 안 된다.
 */
const BOARD_CHIPS: FilterChip<BoardType>[] = [
  { id: 'QUESTION', label: '질문 있어요' },
  { id: 'INFO', label: '정보 공유' },
];

export default function CommunityListScreen() {
  const router = useRouter();
  const [boardType, setBoardType] = useState<BoardType>('QUESTION');

  const {
    data: pages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['communityPosts', boardType],
    queryFn: ({ pageParam }) => fetchPosts({ boardType, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const posts: PostListItem[] = pages?.pages.flatMap((page) => page.content) ?? [];

  const renderList = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="게시글을 불러오지 못했어요." />;
    if (posts.length === 0) {
      // 글자는 웹 CommunityPage의 EmptyState에서 그대로 가져왔다.
      // 마침표만 앱 규칙을 따른다 — 앱의 다른 빈 화면도 다 붙인다.
      return (
        <EmptyState title="아직 게시글이 없어요." description="첫 번째 이야기를 나눠보세요!" />
      );
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/(community)/posts/${item.id}`)}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <PostCard post={item} />
          </Pressable>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppHeader는 left를 받는다. 문자열이면 제목으로 그린다(홈은 로고 이미지를 넘긴다) */}
      <AppHeader left="커뮤니티" />
      <StatusFilterChips chips={BOARD_CHIPS} activeId={boardType} onChange={setBoardType} />
      {renderList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  list: { paddingHorizontal: 16 },
  pressed: { opacity: 0.6 },
});
