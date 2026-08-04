import type { Product } from '@cuddle/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingState,
} from '@/components/list-states';
import { AppHeader, HeaderLogo } from '@/components/ui/app-header';
import { useFavorite } from '@/hooks/use-favorite';
import { useAuthStore } from '@/lib/auth/store';
import { fetchProducts } from '@/lib/products';

// 홈: 로그인 없이 /products/search 실데이터를 무한스크롤로 렌더.
// 데이터층은 웹 홈과 동일하게 TanStack Query useInfiniteQuery.

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 그리는 것이라 getState()가 아니라 구독한다 — 로그인하고 돌아왔을 때 단추가 저절로
  // 나타나야 한다. comment-thread.tsx도 같은 방식으로 본다.
  const isLoggedIn = useAuthStore((state) => state.status) === 'authed';

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: ({ pageParam }) => fetchProducts(pageParam),
    initialPageParam: 0,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). hasNext=false면 종료.
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  // 여러 페이지의 content를 하나의 Product[]로 이어붙임.
  const products: Product[] = data?.pages.flatMap((page) => page.content) ?? [];

  // ----- 3상태 렌더 (로딩/오류/빈은 서로 섞지 않음) -----
  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    // 첫 로드 실패(보여줄 목록이 없음) → 전체 화면 오류.
    if (isError) return <ErrorState onRetry={() => refetch()} />;
    if (products.length === 0) return <EmptyState />;

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <HomeRow product={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 12 },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={<ListFooter loading={isFetchingNextPage} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 손으로 만들었던 「커들마켓」 헤더를 공용 조각으로 바꿨다(#806).
          같은 자리에 로고와 알림 벨이 함께 들어간다. */}
      <AppHeader left={<HeaderLogo />} />
      {renderBody()}

      {/* 웹 Home.tsx와 같은 자리(오른쪽 아래)·같은 색(#825500). 로그인했을 때만 보인다 —
          누르고 나서 로그인하라는 말을 듣는 것보다 아예 안 보이는 편이 낫다. */}
      {isLoggedIn ? (
        <Pressable
          onPress={() => router.push('/products/new')}
          accessibilityRole="button"
          accessibilityLabel="상품 등록"
          style={({ pressed }) => [
            styles.fab,
            // 탭바 바로 위에 띄운다.
            { bottom: FAB_CLEARANCE },
            pressed && styles.fabPressed,
          ]}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fabLabel}>상품 등록</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * 떠 있는 단추가 화면 아래에서 떨어지는 높이.
 *
 * ⚠️ 이 화면의 SafeAreaView는 edges={['top']}이라 **아래 끝이 이미 탭바 위**다.
 *    그래서 탭바 높이(56)를 여기서 또 뺄 이유가 없다 — 예전 값 72는 탭바를 두 번
 *    비키고 있었다.
 *
 * ⚠️ insets.bottom도 더하면 안 된다. 탭바가 이미 제스처 바를 비켜 놓았으므로
 *    같은 여백을 두 번 세게 된다.
 *    **Expo Go에서는 이 실수가 안 보인다** — app.json의 edgeToEdgeEnabled가 Expo Go에는
 *    안 먹어서 insets.bottom이 0이라 더해도 티가 안 난다. 개발 빌드·출시 빌드에서는
 *    24~48이 들어와 단추가 그만큼 떠오른다(2026-08-04 실기기에서 드러났다).
 *
 * 토스트(toast-host.tsx)가 쓰는 72와 다른 이유도 그것이다. 토스트는 탭 화면 밖
 * 루트에 그려서 탭바 높이를 자기가 비켜야 한다.
 */
const FAB_CLEARANCE = 16;

/**
 * 목록의 한 줄. 카드마다 훅이 필요해 별도 컴포넌트로 뺀다
 * (renderItem 안에서는 훅을 부를 수 없다).
 */
function HomeRow({ product }: { product: Product }) {
  const router = useRouter();
  const { toggle, isPending } = useFavorite(product.id, product.isFavorite === true);

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/(home)/products/${product.id}`)}
      // 누르는 동안 살짝 흐려져서 눌린 걸 알 수 있게 한다
      style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
    >
      <ProductCard
        product={product}
        favorite={{
          isFavorite: product.isFavorite === true,
          onToggle: toggle,
          disabled: isPending,
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  cardPressed: {
    opacity: 0.7,
  },
  // bottom은 안전영역 + FAB_CLEARANCE로 그리는 자리에서 정한다.
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#825500',
    // 목록 위에 떠 있는 것이라 그림자가 없으면 카드에 붙어 보인다
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
