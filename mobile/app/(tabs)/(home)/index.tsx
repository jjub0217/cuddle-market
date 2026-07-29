import type { Product } from '@cuddle/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingState,
} from '@/components/list-states';
import { useFavorite } from '@/hooks/use-favorite';
import { fetchProducts } from '@/lib/products';

// 홈: 로그인 없이 /products/search 실데이터를 무한스크롤로 렌더.
// 데이터층은 웹 홈과 동일하게 TanStack Query useInfiniteQuery.

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커들마켓</Text>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

/**
 * 목록의 한 줄. 카드마다 훅이 필요해 별도 컴포넌트로 뺀다
 * (renderItem 안에서는 훅을 부를 수 없다).
 */
function HomeRow({ product }: { product: Product }) {
  const router = useRouter();
  const { toggle, isPending } = useFavorite(product.id);

  return (
    <Pressable
      onPress={() => router.push(`/products/${product.id}`)}
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
  header: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
