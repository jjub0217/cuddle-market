import type { Product } from '@cuddle/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingState,
} from '@/components/list-states';
import { ProductCard } from '@/components/product-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorite } from '@/hooks/use-favorite';
import type { MyListPage } from '@/lib/my-lists';

// 마이 목록 화면 셋(찜한 상품 · 판매 내역 · 구매 내역)의 공통 껍데기.
//
// 세 화면은 제목 · 조회 함수 · 쿼리 키 · 빈 상태 문구 · 찜 버튼 유무만 다르다.
// 껍데기를 하나 두면 5바퀴에서 거래 상태 필터를 넣을 때도 여기 한 곳만 고치면 된다.

const HEADER_HEIGHT = 52; // 홈 · 상세 · 마이와 같은 값

interface Props {
  title: string;
  queryKey: readonly unknown[];
  fetchPage: (page: number) => Promise<MyListPage>;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  /** 찜한 상품 화면만 켠다. 판매 · 구매는 관리용이라 끈다(설계 §5). */
  showFavorite?: boolean;
}

/** 카드를 감싸 "누르면 상세로"를 붙인다. 찜 버튼 유무와 상관없는 공통 부분. */
function RowShell({ productId, children }: { productId: number; children: ReactNode }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/products/${productId}`)}
      style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
    >
      {children}
    </Pressable>
  );
}

/** 찜 버튼이 없는 줄(판매 · 구매). */
function PlainRow({ product }: { product: Product }) {
  return (
    <RowShell productId={product.id}>
      <ProductCard product={product} />
    </RowShell>
  );
}

/**
 * 찜 버튼이 있는 줄(찜한 상품).
 *
 * 왜 줄 컴포넌트를 둘로 나누나:
 * useFavorite은 상품 하나마다 mutation을 만든다. 한 컴포넌트에서 조건부로 부를 수는 없으니
 * (훅 규칙), 찜을 안 쓰는 화면에서 훅이 아예 돌지 않게 하려면 컴포넌트를 나눠야 한다.
 * renderItem 안에서 훅을 부를 수 없다는 제약도 이렇게 함께 풀린다.
 */
function FavoriteRow({ product }: { product: Product }) {
  const { toggle, isPending } = useFavorite(product.id, product.isFavorite === true);

  return (
    <RowShell productId={product.id}>
      <ProductCard
        product={product}
        favorite={{
          isFavorite: product.isFavorite === true,
          onToggle: toggle,
          disabled: isPending,
        }}
      />
    </RowShell>
  );
}

export function MyProductList({
  title,
  queryKey,
  fetchPage,
  emptyTitle,
  emptyDescription,
  errorTitle,
  showFavorite = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). hasNext=false면 종료. 홈과 같은 규칙.
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const products: Product[] = data?.pages.flatMap((page) => page.content) ?? [];

  // ----- 3상태 렌더 (로딩/오류/빈은 서로 섞지 않음) -----
  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title={errorTitle} />;
    if (products.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) =>
          showFavorite ? <FavoriteRow product={item} /> : <PlainRow product={item} />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 12 }]}
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
      {/* 헤더를 직접 그리는 이유는 상세 · 로그인과 같다:
          native-stack 헤더에는 상단 인셋 옵션이 없어 실기기에서 상태바와 붙어 보인다. */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backPressed: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
