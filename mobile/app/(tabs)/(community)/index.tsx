import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommunitySortRow } from '@/components/community/community-sort-row';
import { PostCard } from '@/components/community/post-card';
import { PostSearchInput } from '@/components/community/post-search-input';
import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { StatusFilterChips, type FilterChip } from '@/components/my/status-filter-chips';
import { AppHeader } from '@/components/ui/app-header';
import { fetchPosts, type BoardType, type PostListItem } from '@/lib/community';

// 커뮤니티 목록.
//
// ## 무엇이 붙어 있고 무엇이 사라지는가
//
// ```
// [질문 있어요][정보 공유]      ↑ 고정 (목록 밖)
// [🔍 궁금한 내용을 검색…]       ↓
// ────────────────────────
// 최신순 | 조회 순 | 댓글 순     ← 스크롤되어 사라진다 (ListHeaderComponent)
// 게시글…
// ```
//
// **오가는 축은 고정한다** — 질문 ↔ 정보는 계속 오가고, 검색칸은 지금 무엇을 찾는 중인지
// 보여야 한다. 정렬은 한 번 정하면 잘 안 바꾸므로 같이 스크롤된다(#857 설계 §3).
//
// ⚠️ **`SectionList` 를 안 쓴다.** 붙일 줄이 없다. 상품 목록은 정렬 툴바를 붙이느라
//    바꿔야 했지만(안드로이드는 sticky 가 기본으로 꺼져 있다) 여기는 그럴 일이 없다.

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
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  /**
   * 탭을 바꾸면 **검색어와 정렬을 푼다.**
   *
   * 웹이 그렇다 — 탭 전환만 다른 파라미터를 안 이어붙인다
   * (`CommunityPage.tsx` 의 `handleTabChange` 가 `?tab=` 하나만 쓴다).
   * 질문 ↔ 정보는 다른 갈래라 조건을 들고 갈 이유가 없다.
   */
  const changeBoardType = (next: BoardType) => {
    setBoardType(next);
    setKeyword('');
    setSortBy('latest');
  };

  const {
    data: pages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // ⚠️ **조건을 열쇠에 다 넣는다.** 하나라도 빠지면 그 조건만 안 먹는다 —
    //    이미 받아 둔 페이지를 그대로 쓰고 2페이지부터 이어 받아 뒤섞인 목록이 된다
    //    (16바퀴에서 겪었다).
    queryKey: ['communityPosts', boardType, keyword, sortBy],
    queryFn: ({ pageParam }) => fetchPosts({ boardType, page: pageParam, keyword, sortBy }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const posts: PostListItem[] = pages?.pages.flatMap((page) => page.content) ?? [];

  const renderList = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title="게시글을 불러오지 못했어요." />;
    if (posts.length === 0) {
      // ⚠️ 검색해서 0건인지, 원래 글이 없는지를 **가른다.**
      //    웹에는 앞엣것이 없다 — 검색해도 「첫 번째 이야기를 나눠보세요!」가 그대로 뜬다.
      //    검색 결과가 없는데 그 문구는 어색해서 앱에서 갈랐다(상품도 그렇게 했다).
      //    「검색 결과가 없습니다」는 상품과 같은 문구라 앱 안에서 통일된다.
      if (keyword) {
        return (
          <EmptyState
            icon="search"
            title="검색 결과가 없습니다"
            description="다른 검색어로 찾아보세요"
          />
        );
      }
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
        // 정렬 줄은 목록과 함께 스크롤되어 사라진다(설계 §3).
        // ⚠️ 목록이 비면 이 헤더도 안 그려진다 — 그때는 고를 것도 없으니 괜찮다.
        //    되돌릴 길(칩 줄·검색칸)은 목록 **밖**에 있어 늘 보인다.
        ListHeaderComponent={<CommunitySortRow sortBy={sortBy} onChange={setSortBy} />}
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
      {/* 여기 둘은 목록 **밖**이라 늘 보인다 — 빈 화면·오류일 때도 조건을 되돌릴 수 있다 */}
      <StatusFilterChips chips={BOARD_CHIPS} activeId={boardType} onChange={changeBoardType} />
      <PostSearchInput keyword={keyword} onSubmit={setKeyword} />
      {renderList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  list: { paddingHorizontal: 16 },
  pressed: { opacity: 0.6 },
});
