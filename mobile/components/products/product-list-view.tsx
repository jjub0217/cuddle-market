import type { Product } from '@cuddle/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, ListFooter, LoadingState } from '@/components/list-states';
import { ProductCard } from '@/components/product-card';
import {
  DetailFilterSheet,
  type DetailFilterValue,
} from '@/components/products/detail-filter-sheet';
import {
  ProductFilterRow,
  ProductPetTypeTabs,
} from '@/components/products/product-filter-row';
import { ProductListToolbar } from '@/components/products/product-list-toolbar';
import { useFavorite } from '@/hooks/use-favorite';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { fetchProducts } from '@/lib/products';
import { EMPTY_FILTERS, toParams, type ProductFilters } from '@/lib/products/filters';

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
//
// ## 무엇이 붙어 있고 무엇이 사라지는가
//
// ```
// [전체][포유류][조류]…       ← 목록 **밖**이라 늘 화면에 남는다   (SectionList 형제)
// ────────────────────
// 소분류·카테고리            ← 목록과 함께 스크롤되어 사라진다     (ListHeaderComponent)
// [전체][판매][판매요청] [⚙] ← 위로 올라가면 화면에 붙는다        (섹션 헤더)
// 상품들
// ```
//
// 필터 넷을 다 고정하면 폰 세로의 3분의 1이 필터가 된다(설계 §2). 그렇다고 툴바까지
// 사라지면 종류·정렬을 바꾸려고 매번 맨 위로 올라가야 한다.
// FlatList는 헤더 **전체**만 붙일 수 있어 이 둘을 갈라 놓지 못한다. SectionList는
// 섹션 헤더만 붙는다(`stickySectionHeadersEnabled`).
// ⚠️ 안드로이드는 그 값이 **기본으로 꺼져 있다** — 명시해야 한다.
//
// ⚠️ **붙는 것은 섹션 헤더 하나뿐이다.** 대분류 탭까지 늘 보이게 하려면 목록 **밖**에
//    형제로 두는 수밖에 없다(#855 후속). 세로를 86dp쯤 더 쓰지만, 대분류는 계속 오가는
//    축인데 홈에 「맨 위로」 단추가 없어 한 번 내려가면 닿기 어렵다.

export interface ProductListViewRef {
  /**
   * 처음 상태로 되돌린다 — 필터를 풀고 맨 위로 올린다.
   *
   * 홈에서 **로고를 누르거나 홈 탭을 다시 누를 때** 부른다. 「홈으로」는 「처음 상태로」라는
   * 뜻이고, 거의 모든 앱에서 탭을 다시 누르는 건 그 신호다. 웹도 로고·하단바 홈이
   * 조건 없는 맨 주소(`/`)로 간다.
   */
  reset: () => void;
}

interface Props {
  /** 있으면 검색 결과, 없으면 홈 */
  keyword?: string;
  /** 목록 끝에 비워 둘 높이. 홈에서 떠 있는 단추 자리를 넘긴다 */
  bottomInset?: number;
}

export const ProductListView = forwardRef<ProductListViewRef, Props>(function ProductListView(
  { keyword, bottomInset = 12 },
  ref
) {
  // 조건 여덟 개를 한 덩어리로 든다. 흩어 두면 queryKey에 하나 빠뜨리기 쉽다.
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<SectionList<Product>>(null);

  // ⚠️ **꼭 함수형으로 고친다.** 대분류를 바꾸면 필터 줄이 「소분류 풀기」와 「대분류 바꾸기」를
  //    **연달아** 부른다. 지금 값을 펴서 쓰면(`{...filters, …}`) 두 번째가 첫 번째를 덮어써서
  //    푼 소분류가 되살아난다.
  const patch = (next: Partial<ProductFilters>) => setFilters((prev) => ({ ...prev, ...next }));

  // 목록이 안 그려져 있을 수도 있다(빈 화면·오류일 때). 그때는 올릴 것이 없다.
  // scrollToLocation은 첫 상품 기준이라 위쪽 필터 줄이 가려진다 — 스크롤 자체를 0으로 보낸다.
  const 맨위로 = useCallback(() => {
    listRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated: true });
  }, []);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setFilters(EMPTY_FILTERS);
      맨위로();
    },
  }));

  // **조건을 바꾸면 맨 위로 올린다**(#937).
  //
  // 한참 내려간 자리에서 알약이나 필터를 바꾸면 내용만 갈리고 **스크롤은 내려가 있던 자리
  // 그대로**다. 새 조건의 첫 상품이 화면 위에 있는데 사용자는 한참 아래를 보고 있게 된다.
  //
  // 조건을 **글자 하나로 접어서** 견준다. 덩어리를 그대로 놓으면 값이 같아도 새 객체라 매번
  // 다시 돌고, 하나씩 늘어놓으면 조건이 늘 때 빠뜨린다. 질의 열쇠와 같은 것을 본다.
  const 조건열쇠 = JSON.stringify({ keyword, ...filters });
  // ⚠️ **첫 그림에서는 올리지 않는다.** 막 그려질 때도 「바뀌었다」로 보면 쓸데없이 스크롤을
  //    건드린다. 지난 조건을 **처음부터 지금 값으로** 채워 두면 첫 비교가 저절로 같아진다.
  //    (같은 함정을 `hooks/use-refetch-on-focus.ts` 의 「첫 초점은 건너뛴다」에서 이미 겪었다.)
  const 지난조건 = useRef(조건열쇠);

  useEffect(() => {
    if (지난조건.current === 조건열쇠) return;
    지난조건.current = 조건열쇠;
    // reset() 은 자기도 올리므로 여기까지 오면 두 번 올라간다. 둘 다 같은 자리(y=0)로 가서
    // 눈에는 한 번으로 보인다 — 대신 조건이 이미 비어 있을 때도 reset() 이 올려 준다.
    맨위로();
  }, [조건열쇠, 맨위로]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // ⚠️ **조건을 열쇠에 다 넣는다.** 하나라도 빠지면 그 조건만 안 먹는다 —
    //    이미 받아 둔 페이지를 그대로 쓰고 2페이지부터 이어 받아 **뒤섞인 목록**이 된다.
    //    덩어리째 펼쳐 넣는 이유가 이것이다. 조건이 늘어도 여기를 고칠 일이 없다.
    queryKey: ['products', { keyword, ...filters }],
    queryFn: ({ pageParam }) => fetchProducts(toParams(filters, pageParam, keyword)),
    initialPageParam: 0,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). hasNext=false면 종료.
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  // 상품을 보고 돌아오면 그 상품의 조회수가 달라져 있다. 목록은 다시 안 만들어지므로
  // 우리가 불러 줘야 한다(#932).
  useRefetchOnFocus(refetch);

  // 여러 페이지의 content를 하나의 Product[]로 이어붙임.
  const products: Product[] = data?.pages.flatMap((page) => page.content) ?? [];

  // 목록이 비었을 때 뭐라고 할지.
  //
  // ⚠️ **문구를 새로 짓지 않는다. 웹에 이미 있다.**
  //    src/features/home/components/product-section/ProductsSection.tsx:136
  //      「검색 결과가 없습니다 / 다른 필터 조건으로 검색해보세요」
  //    웹은 **검색과 필터를 안 나눈다** — 목록이 비면 이 하나로 끝낸다. 여기도 그렇게 한다.
  //
  //    (2026-08-06: 처음엔 홈 문구가 검색 결과까지 따라갔고, 그걸 고치면서 내가 문구를
  //     새로 지었다. 둘 다 잘못이었다. 웹을 먼저 찾았어야 했다.)
  //
  // 정렬은 여기서 뺀다 — 「최신순」이 「고른 조건」은 아니다. 정렬만 바꿨는데 목록이 비면
  // 그건 앱에 상품이 없는 것이지 조건이 좁아서가 아니다.
  const { sortBy: _sortBy, ...좁히는조건 } = filters;
  const 조건이걸렸다 = Boolean(keyword) || Object.values(좁히는조건).some((v) => v !== null);

  // 목록 밖에 서는 줄. 그래서 `ListHeaderComponent`가 아니라 `SectionList`의 형제로 그린다.
  /**
   * **검색 결과에서는 「무엇을」 좁히는 줄을 안 그린다**(#954).
   *
   * 홈은 둘러보는 화면이라 필터가 앞에 있는 게 맞다. 검색 결과는 **찾을 게 정해져 있어
   * 들어온** 화면이라 다르다 — 대분류 탭과 카테고리 격자가 첫 화면의 40%를 먹어서
   * **결과가 한참 아래에서 시작했다.**
   *
   *   빼는 것   카테고리 격자   「무엇을」 — 검색어와 겹친다. 자리를 제일 많이 먹는다
   *            대분류 탭      「어떤 동물의」
   *            소분류 알약     대분류를 골라야 나오는 줄이라 같이 사라진다
   *
   *   남기는 것  상품종류 알약 · ⚙ 세부 필터 · 정렬 — 검색어와 안 겹치는 축이다
   *
   * ⚠️ 동물로 좁히고 싶으면 ⚙(세부 필터)로 들어가거나 뒤로 가서 홈에서 고른다.
   *    그 대신 **결과가 바로 보인다.**
   *
   * ⚠️ **규칙은 하나다 — 화면이 좁으면 감추고 넓으면 보인다.** 앱은 늘 좁으니 늘 감춘다.
   *    웹은 좁을 때만 감춘다(Home.tsx 의 `hidden md:block`) — 데스크탑은 자리가 넉넉해
   *    다 보여도 답답하지 않다.
   */
  const 검색결과다 = Boolean(keyword);

  const 대분류탭 = (
    <ProductPetTypeTabs
      petType={filters.petType}
      petDetailType={filters.petDetailType}
      onChangePetType={(next) => patch({ petType: next })}
      onChangePetDetailType={(next) => patch({ petDetailType: next })}
    />
  );

  const 필터줄 = (
    <ProductFilterRow
      petType={filters.petType}
      petDetailType={filters.petDetailType}
      category={filters.category}
      onChangePetDetailType={(next) => patch({ petDetailType: next })}
      onChangeCategory={(next) => patch({ category: next })}
    />
  );

  const 툴바 = (
    <ProductListToolbar
      productType={filters.productType}
      sortBy={filters.sortBy}
      onChangeProductType={(next) => patch({ productType: next })}
      onChangeSort={(next) => patch({ sortBy: next })}
      onPressFilter={() => setSheetOpen(true)}
      // 시트가 담는 넷 중 하나라도 있으면 걸린 것이다 — 시트의 DetailFilterValue 와 같은 묶음
      hasDetailFilter={Boolean(filters.productStatus || filters.price || filters.sido || filters.gugun)}
    />
  );

  // ----- 3상태 렌더 (로딩/오류/빈은 서로 섞지 않음) -----
  //
  // ⚠️ **목록은 늘 그린다.** 로딩·오류·빈 화면은 목록 **안쪽**(ListEmptyComponent)에 넣는다.
  //
  //    처음에는 이 셋일 때 목록을 통째로 안 그리고 필터를 밖에 따로 그렸다. 조건을 되돌릴
  //    길을 남기려던 것이었는데, 그러면 **필터 줄이 두 자리를 오간다** — 조건을 바꿀 때마다
  //    「불러오는 중」을 지나며 헤더 안 → 밖 → 헤더 안으로 옮겨 다닌다.
  //    자리가 바뀌면 React가 조각을 새로 만들고, 소분류 줄의 접힘 상태가 초기화되어
  //    **펼쳐지는 모습 없이 툭 나타난다**(2026-08-06 실기기에서 나온 것).
  //
  //    한 자리에 못 박으니 되돌릴 길도 남고 움직임도 살아난다.
  const renderEmpty = () => {
    if (isLoading) return <LoadingState />;
    // 첫 로드 실패(보여줄 목록이 없음) → 전체 화면 오류.
    if (isError) return <ErrorState onRetry={() => refetch()} />;
    // 조건 없이 비었다면 앱에 상품이 정말 하나도 없는 것이다 — 그때는 앱이 원래 쓰던
    // 문구(「아직 등록된 상품이 없어요 / 첫 상품이 올라오면…」)가 맞다.
    return 조건이걸렸다 ? (
      <EmptyState
        icon="search"
        title="검색 결과가 없습니다"
        description="다른 필터 조건으로 검색해보세요"
      />
    ) : (
      <EmptyState />
    );
  };

  return (
    <>
      {검색결과다 ? null : 대분류탭}
      <SectionList
        ref={listRef}
        testID="product-list"
        // 섹션은 늘 하나다. 목록을 나누려는 게 아니라 **툴바를 붙이려고** 쓴다.
        sections={[{ data: products }]}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ProductRow product={item} />
          </View>
        )}
        ListHeaderComponent={검색결과다 ? null : 필터줄}
        renderSectionHeader={() => 툴바}
        // ⚠️ 안드로이드는 기본이 false다. 안 주면 툴바가 같이 스크롤되어 사라진다
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        // ⚠️ 빈 화면 안내를 `ListEmptyComponent` 에 못 넣는다. 그건 **섹션이 하나도 없을 때만**
        //    그려지는데, 우리는 「빈 섹션 하나」라서 안 걸린다(실측). 섹션을 없애면 섹션 헤더인
        //    툴바까지 사라져 조건을 되돌릴 길이 없어진다.
        //    그래서 목록 끝자리에 넣는다 — 항목이 없으니 자리는 똑같다.
        ListFooterComponent={
          <>
            {products.length === 0 && renderEmpty()}
            <ListFooter loading={isFetchingNextPage} />
          </>
        }
      />
      <DetailFilterSheet
        visible={sheetOpen}
        value={{
          productStatus: filters.productStatus,
          price: filters.price,
          sido: filters.sido,
          gugun: filters.gugun,
        }}
        onClose={() => setSheetOpen(false)}
        onApply={(next: DetailFilterValue) => {
          patch(next);
          setSheetOpen(false);
        }}
      />
    </>
  );
});

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
  // 여백을 카드 줄이 스스로 갖는다. contentContainerStyle에 주면 필터 줄·툴바까지
  // 같이 밀려 좌우가 두 겹이 된다(그 둘은 자기 여백을 이미 갖고 있다).
  item: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cardPressed: {
    opacity: 0.7,
  },
});
