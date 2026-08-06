import type { Product } from '@cuddle/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { ProductCard } from '@/components/product-card';
import { ProductFilterRow } from '@/components/products/product-filter-row';
import { useFavorite } from '@/hooks/use-favorite';
import { fetchProducts } from '@/lib/products';

// 상품 목록. **홈과 검색 결과가 이 조각 하나를 나눠 쓴다.**
//
// 둘은 조건 하나(검색어)가 다를 뿐 같은 것이다. 따로 만들면 필터를 두 벌 만들게 되고,
// 나중에 「결과 화면에도 필터가 필요한가」를 또 고민하게 된다. 조각 안에 두면 저절로
// 양쪽에 생긴다(설계 §2).
//
// ⚠️ **필터 상태를 이 안에 둔다.** 그래야 홈과 결과 화면이 각자의 필터를 갖는다 —
//    검색하고 뒤로 왔을 때 홈에서 고른 것이 그대로 남는다.
//
// 화면(홈)에 남는 것: SafeAreaView · AppHeader · 떠 있는 「상품 등록」 단추.
// 그건 목록의 일이 아니다.

interface Props {
  /** 있으면 검색 결과, 없으면 홈 */
  keyword?: string;
  /** 목록 끝에 비워 둘 높이. 홈에서 떠 있는 단추 자리를 넘긴다 */
  bottomInset?: number;
}

export function ProductListView({ keyword, bottomInset = 12 }: Props) {
  const [petType, setPetType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // ⚠️ **조건을 열쇠에 넣는다.** 안 넣으면 필터를 바꿔도 이미 받아 둔 페이지를 그대로
    //    쓰고 2페이지부터 이어 받아 **뒤섞인 목록**이 된다.
    queryKey: ['products', { keyword, petType, category }],
    queryFn: ({ pageParam }) =>
      fetchProducts({
        page: pageParam,
        keyword,
        // null 이면 안 보낸다 — 「전체」가 이 경우다(lib/products.ts 주석 참고).
        petType: petType ?? undefined,
        categories: category ?? undefined,
      }),
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
        renderItem={({ item }) => <ProductRow product={item} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
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
    <>
      {/* 목록이 비어도 알약은 보인다 — 안 보이면 조건을 되돌릴 방법이 없다. */}
      <ProductFilterRow
        petType={petType}
        category={category}
        onChangePetType={setPetType}
        onChangeCategory={setCategory}
      />
      {renderBody()}
    </>
  );
}

/**
 * 목록의 한 줄. 카드마다 훅이 필요해 별도 컴포넌트로 뺀다
 * (renderItem 안에서는 훅을 부를 수 없다).
 */
function ProductRow({ product }: { product: Product }) {
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
