import type { Product } from '@cuddle/shared';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { ProductCard } from '@/components/product-card';
import { BlockConfirm } from '@/components/report/block-confirm';
import { StatusFilterChips, type FilterChip } from '@/components/my/status-filter-chips';
import { ProfileHead } from '@/components/user-profile/profile-head';
import { useMe } from '@/hooks/use-me';
import { unblockUser } from '@/lib/reports';
import { showToast } from '@/lib/toast';
import { fetchUserProducts, fetchUserProfile, type ProductKind } from '@/lib/user-profile';

// 판매자 프로필. 상품 상세의 판매자 카드를 눌러 들어온다.
//
// 왜 MyProductList를 안 쓰나:
// 그 안의 RowShell이 이동 경로를 /(tabs)/(my)/products/... 로 못 박고 있어서,
// 홈 스택에서 쓰면 상품을 누를 때 마이 탭으로 튄다. 게다가 헤더 제목 · 등록 버튼 ·
// 상태 필터 칩 · 관리 시트를 다 안고 있어 여기 필요 없는 게 많다.
// 목록을 여기서 직접 그리는 게 짧고 정확하다.

const HEADER_HEIGHT = 52;

/**
 * 무엇을 보여줄지 고르는 칩. 마이 목록(판매 내역 등)과 **같은 조각·같은 생김새**다.
 *
 * 고르는 축은 다르다 — 마이는 거래 상태(판매중·예약중…)를 한 목록 안에서 거르고,
 * 여기는 상품 종류라 서버 주소가 아예 나뉜다. 그래도 「목록 위에서 고르는 줄」이
 * 앱 안에서 두 모양이면 안 되므로 조각을 함께 쓴다.
 *
 * 「전체」가 없는 이유: 서버에 그 주소가 없다. 두 목록을 앱이 합치면 페이지 경계와
 * 정렬을 떠안는다(설계 §5). 웹도 둘뿐이다.
 */
const KIND_CHIPS: FilterChip<ProductKind>[] = [
  { id: 'sell', label: '판매상품' },
  { id: 'request', label: '판매요청' },
];

export default function UserProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  // 이 화면은 홈 스택과 마이 스택 양쪽에 있다((my)/users/[id].tsx가 이걸 다시 내보낸다).
  // 상품으로 갈 때 그룹을 고정하면 마이에서 들어온 사람이 홈 탭으로 튄다.
  // string[]으로 넓히는 이유는 seller-card.tsx의 같은 자리에 적어 뒀다.
  const segments = useSegments() as string[];
  const group = segments.includes('(my)') ? '(my)' : '(home)';

  const { data: me } = useMe();
  const [kind, setKind] = useState<ProductKind>('sell');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
  });

  const {
    data: pages,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['userProducts', userId, kind],
    queryFn: ({ pageParam }) => fetchUserProducts(userId, kind, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const products: Product[] = pages?.pages.flatMap((page) => page.content) ?? [];
  const isMine = Boolean(me && profile && me.id === profile.id);

  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
  };

  const handleUnblock = async () => {
    try {
      await unblockUser(userId);
      refreshProfile();
      showToast('차단을 해제했습니다');
    } catch {
      showToast('차단 해제에 실패했습니다');
    }
  };

  /** ⋮ 에 담을 항목. isBlocked·isReported가 있어 상태를 정확히 그린다(설계 §8). */
  const sheetActions: SheetAction[] = profile
    ? [
        profile.isBlocked
          ? {
              label: '차단 해제',
              onPress: () => {
                setIsSheetOpen(false);
                handleUnblock();
              },
            }
          : {
              label: '차단하기',
              tone: 'danger',
              onPress: () => {
                setIsSheetOpen(false);
                setIsBlockOpen(true);
              },
            },
        profile.isReported
          ? { label: '신고완료', onPress: () => setIsSheetOpen(false) }
          : {
              label: '신고하기',
              onPress: () => {
                setIsSheetOpen(false);
                router.push({
                  pathname: '/report',
                  params: { kind: 'user', id: String(userId), name: profile.nickname },
                });
              },
            },
      ]
    : [];

  const renderList = () => {
    if (listLoading) return <LoadingState />;
    if (listError) {
      return <ErrorState onRetry={() => refetchList()} title="상품을 불러오지 못했어요." />;
    }
    if (products.length === 0) {
      return (
        <EmptyState
          title={kind === 'sell' ? '등록한 판매 상품이 없어요.' : '등록한 판매 요청이 없어요.'}
          description="다른 탭도 살펴보세요."
        />
      );
    }

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            // 지금 스택에 상세를 쌓는다. 그룹까지 적어야 다른 탭으로 안 튄다.
            onPress={() => router.push(`/(tabs)/${group}/products/${item.id}`)}
            style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
          >
            <ProductCard product={item} />
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

  const renderBody = () => {
    if (profileLoading) return <LoadingState />;
    if (profileError || !profile) {
      return <ErrorState onRetry={() => refetchProfile()} title="프로필을 불러오지 못했어요." />;
    }

    return (
      <>
        <ProfileHead profile={profile} />
        <StatusFilterChips chips={KIND_CHIPS} activeId={kind} onChange={setKind} />
        {renderList()}
      </>
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

        {/* 내 프로필에는 ⋮ 를 안 그린다 — 나를 신고·차단할 이유가 없다. */}
        {profile && !isMine ? (
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
      {profile ? (
        <BlockConfirm
          visible={isBlockOpen}
          nickname={profile.nickname}
          userId={userId}
          onClose={() => setIsBlockOpen(false)}
          onDone={() => {
            setIsBlockOpen(false);
            refreshProfile();
            showToast('차단했습니다');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pressed: { opacity: 0.5 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  cardPressed: { opacity: 0.7 },
});
