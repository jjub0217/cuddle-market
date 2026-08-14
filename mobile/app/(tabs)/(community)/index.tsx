import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommunitySortRow } from '@/components/community/community-sort-row';
import { PostCard } from '@/components/community/post-card';
import { PostSearchInput } from '@/components/community/post-search-input';
import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { StatusFilterChips, type FilterChip } from '@/components/my/status-filter-chips';
import { AppHeader } from '@/components/ui/app-header';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth/store';
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

  // 그리는 것이라 getState()가 아니라 구독한다 — 로그인하고 돌아왔을 때 단추가 저절로
  // 나타나야 한다. 홈 탭의 「상품 등록」도 같은 방식으로 본다.
  const isLoggedIn = useAuthStore((state) => state.status) === 'authed';

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
        // 떠 있는 단추가 마지막 글을 가리지 않게 그만큼 비워 둔다(홈이 ProductListView 에
        // bottomInset 으로 넘기는 것과 같은 값이다).
        // ⚠️ 단추가 있을 때만이다 — 게스트에겐 단추가 없어서, 늘 비워 두면 목록 끝이
        //    허전하게 뚫린다(홈에서 2026-08-04에 잡았던 것과 같은 자리).
        //
        // 홈처럼 목록을 조각으로 갈라 두지 않아 여기서는 값을 바로 준다. 갈라내려면
        // 이 화면의 목록을 통째로 옮겨야 하는데, 쓰는 곳이 하나뿐이라 아직 이르다.
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isLoggedIn ? FAB_CLEARANCE + FAB_HEIGHT + 12 : 12 },
        ]}
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

      {/* 웹 모바일과 같은 자리(오른쪽 아래)·같은 문구다(CommunityPage.tsx:374).
          모양은 홈 탭의 「상품 등록」에서 그대로 가져왔다 — 같은 뜬 단추가 화면마다
          다르게 생기면 안 된다.

          ⚠️ **게스트에게는 아예 안 그린다.** 웹도 `isLogin()` 일 때만 그리고
             (CommunityPage.tsx:365), 홈도 그렇다. 누르고 나서 로그인하라는 말을 듣는
             것보다 안 보이는 편이 낫다. */}
      {isLoggedIn ? (
        <Pressable
          // ⚠️ 지금 보고 있는 게시판을 들고 간다. 웹이 `?tab=` 으로 하는 것과 같다 —
          //    안 들고 가면 정보 공유를 보다가 쓴 글이 질문 게시판에 올라간다.
          onPress={() => router.push({ pathname: '/community-post', params: { boardType } })}
          accessibilityRole="button"
          accessibilityLabel="글쓰기"
          style={({ pressed }) => [
            styles.fab,
            // 탭바 바로 위에 띄운다.
            { bottom: FAB_CLEARANCE },
            pressed && styles.fabPressed,
          ]}
        >
          <Plus size={20} color={colors.onAction} strokeWidth={2.5} />
          <Text style={styles.fabLabel}>글쓰기</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * 떠 있는 단추가 화면 아래에서 떨어지는 높이. 홈 탭에서 그대로 가져왔다.
 *
 * ⚠️ 이 화면의 `SafeAreaView` 는 `edges={['top']}` 이라 **아래 끝이 이미 탭바 위**다.
 *    탭바 높이를 여기서 또 뺄 이유가 없고, `insets.bottom` 도 더하면 안 된다 —
 *    탭바가 이미 제스처 바를 비켜 놓아 같은 여백을 두 번 세게 된다.
 *
 * 토스트(toast-host.tsx)가 쓰는 72와 다른 이유가 그것이다. 토스트는 탭 화면 밖 루트에
 * 그려서 탭바 높이를 자기가 비켜야 한다.
 */
const FAB_CLEARANCE = 16;

/**
 * 떠 있는 단추의 높이. 목록 끝에 그만큼을 비워 마지막 글이 안 가리게 한다.
 * 홈에서 재서 못 박은 값이다 — 위아래 여백 12+12에 글자·아이콘 줄 높이 20쯤.
 */
const FAB_HEIGHT = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { paddingHorizontal: 16 },
  pressed: { opacity: 0.6 },
  // bottom 은 FAB_CLEARANCE 로 그리는 자리에서 정한다.
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    // 누르면 글쓰기로 넘어가는 행동이라 「고른 상태」가 아니다 — action 을 쓴다
    backgroundColor: colors.action,
    // 목록 위에 떠 있는 것이라 그림자가 없으면 글에 붙어 보인다
    elevation: 4,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onAction,
  },
});
