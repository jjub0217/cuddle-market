import type { Product } from '@cuddle/shared';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ErrorState,
  ListFooter,
  LoadingState,
} from '@/components/list-states';
import { MyListEmpty } from '@/components/my/my-list-empty';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import {
  StatusFilterChips,
  type FilterChip,
  type StatusFilter,
} from '@/components/my/status-filter-chips';
import { ProductCard } from '@/components/product-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronLeft, Plus, type LucideIcon } from 'lucide-react-native';
import { useFavorite } from '@/hooks/use-favorite';
import { useProductActions } from '@/hooks/use-product-actions';
import type { MyListPage } from '@/lib/my-lists';
import type { TradeStatus } from '@/lib/product-actions';
import { buildOwnerActions, type MenuKind } from '@/lib/product-menu';
import { colors } from '@/constants/colors';
import { deleteProduct } from '@/lib/products';
import { showToast } from '@/lib/toast';

// 마이 목록 화면 셋(찜한 상품 · 판매 내역 · 판매요청 내역)의 공통 껍데기.
//
// 세 화면은 제목 · 조회 함수 · 쿼리 키 · 빈 상태 문구 · 찜 버튼 유무만 다르다.
// 껍데기를 하나 두면 5바퀴에서 거래 상태 필터를 넣을 때도 여기 한 곳만 고치면 된다.

const HEADER_HEIGHT = 52; // 홈 · 상세 · 마이와 같은 값

interface Props {
  /** 헤더에 그릴 제목. 마이페이지 메뉴 이름과 같다(예: 판매 내역). */
  title: string;
  /** 목록 위 제목 영역. 웹 패널과 같은 문구(예: 내가 등록한 상품). */
  heading: string;
  queryKey: readonly unknown[];
  fetchPage: (page: number, tradeStatus?: TradeStatus) => Promise<MyListPage>;
  /** 빈 상태에 그릴 Lucide 아이콘. 웹 MyPagePanel과 같은 타입이다. */
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  /**
   * 등록 버튼 문구. 없으면 버튼을 그리지 않는다(찜한 상품).
   *
   * 11바퀴에 등록 화면이 생겨 이제 눌린다. 그전에는 흐린 채로 자리만 잡고 있었다.
   */
  registerLabel?: string;
  /** 찜한 상품 화면만 켠다. 판매 내역 · 판매요청 내역은 관리용이라 끈다(설계 §5). */
  showFavorite?: boolean;
  /** 있으면 카드에 ⋮ 가 붙고 관리 시트를 연다. 찜한 상품은 넘기지 않는다. */
  listKind?: MenuKind;
  /** 있으면 목록 위에 상태 필터 칩을 그린다. 찜한 상품은 넘기지 않는다. */
  filterChips?: FilterChip[];
}

/** 카드를 감싸 "누르면 상세로"를 붙인다. 찜 버튼 유무와 상관없는 공통 부분. */
function RowShell({ productId, children }: { productId: number; children: ReactNode }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/my/products/${productId}`)}
      style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
    >
      {children}
    </Pressable>
  );
}

/** 찜 버튼이 없는 줄(판매 내역 · 판매요청 내역). 관리 목록이면 ⋮ 가 붙는다. */
function PlainRow({ product, onMorePress }: { product: Product; onMorePress?: () => void }) {
  return (
    <RowShell productId={product.id}>
      <ProductCard product={product} onMorePress={onMorePress} />
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
  heading,
  queryKey,
  fetchPage,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  errorTitle,
  registerLabel,
  showFavorite = false,
  listKind,
  filterChips,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 시트를 연 상품. null이면 시트가 닫혀 있다.
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  // 삭제 확인 창을 연 상품.
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const { changeStatus, isPending } = useProductActions(queryKey);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // 필터가 키에 들어가므로 바꾸면 새 무한스크롤이 시작된다.
    // 이전 필터 결과는 캐시에 남아 되돌아오면 즉시 보인다.
    queryKey: [...queryKey, filter],
    queryFn: ({ pageParam }) => fetchPage(pageParam, filter === 'ALL' ? undefined : filter),
    initialPageParam: 0,
    // 다음 페이지 번호 = 지금까지 받은 페이지 수(0-base). hasNext=false면 종료. 홈과 같은 규칙.
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  });

  const products: Product[] = data?.pages.flatMap((page) => page.content) ?? [];
  // 서버가 첫 페이지에 전체 개수를 함께 준다. 아직 못 받았으면 개수 줄을 숨긴다.
  const total = data?.pages[0]?.total;

  /**
   * 시트에 그릴 항목. 무엇을 보일지는 lib/product-menu.ts가 정하고,
   * 여기서는 눌렀을 때 할 일만 붙인다.
   */
  const buildSheetActions = (): SheetAction[] => {
    if (!sheetProduct || !listKind) return [];

    // 시트가 닫히면서 sheetProduct가 null이 되므로 눌린 상품을 미리 붙잡아 둔다.
    const target = sheetProduct;

    return buildOwnerActions(listKind, target.tradeStatus).map((action): SheetAction => {
      if (action.kind === 'status') {
        return {
          label: action.label,
          onPress: () => {
            if (action.next) changeStatus(target.id, action.next);
            setSheetProduct(null);
          },
        };
      }

      if (action.kind === 'edit') {
        return {
          label: action.label,
          onPress: () => {
            setSheetProduct(null);
            // as Href: 수정 화면은 아직 없어(Task 10) 자동 생성된 경로 목록에 안 잡힌다.
            // from=my: 끝나면 마이 스택의 상세로 돌아간다(홈 탭으로 튀지 않게)
            router.push(`/products/${target.id}/edit?from=my` as Href);
          },
        };
      }

      return {
        label: action.label,
        tone: action.tone,
        onPress: () => {
          // 시트를 먼저 닫고 확인 창을 연다. 두 개가 겹쳐 뜨지 않게.
          setSheetProduct(null);
          setDeleteTarget(target);
        },
      };
    });
  };

  // ----- 3상태 렌더 (로딩/오류/빈은 서로 섞지 않음) -----
  const renderBody = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState onRetry={() => refetch()} title={errorTitle} />;
    if (products.length === 0) {
      return <MyListEmpty icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
    }

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) =>
          showFavorite ? (
            <FavoriteRow product={item} />
          ) : (
            <PlainRow
              product={item}
              // 요청이 도는 동안 다시 누르면 상태 변경이 겹친다. 버튼은 그대로 두되 무시한다.
              onMorePress={
                listKind
                  ? () => {
                      if (!isPending) setSheetProduct(item);
                    }
                  : undefined
              }
            />
          )
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
          <ChevronLeft size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {filterChips ? (
        <StatusFilterChips chips={filterChips} activeId={filter} onChange={setFilter} />
      ) : null}

      {/* 제목 영역. 웹 패널의 MyPageTitle과 같은 자리 — 제목 · 개수 · 등록 버튼. */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.heading}>{heading}</Text>
          {total !== undefined ? (
            <Text style={styles.count}>
              {/* 웹과 같이 "전체 2"처럼 필터 이름 + 개수. 필터가 없는 찜 목록은 "상품 2". */}
              {`${filterChips?.find((chip) => chip.id === filter)?.label ?? '상품'} ${total}`}
            </Text>
          ) : null}
        </View>
        {registerLabel ? (
          // 홈의 떠 있는 단추와 같은 곳으로 간다. 웹도 이 자리에서 등록 화면으로 보낸다.
          <Pressable
            onPress={() => router.push('/products/new?from=my')}
            accessibilityRole="button"
            accessibilityLabel={registerLabel}
            style={({ pressed }) => [styles.registerButton, pressed && styles.registerPressed]}
          >
            <Plus size={16} color={colors.onAction} />
            <Text style={styles.registerLabel}>{registerLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {renderBody()}

      <ProductActionSheet
        visible={sheetProduct !== null}
        onClose={() => setSheetProduct(null)}
        actions={buildSheetActions()}
      />

      {/* 문구는 웹 삭제 확인 창 그대로다. 지운 뒤에도 목록에 머문다(웹과 같다). */}
      <ConfirmDialog
        visible={deleteTarget !== null}
        heading="상품 삭제"
        description="정말로 이 상품을 삭제하시겠습니까?"
        notes={['삭제된 상품은 복구할 수 없습니다']}
        confirmLabel="삭제하기"
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          const target = deleteTarget;
          if (!target) return;

          try {
            await deleteProduct(target.id);
            // 목록(모든 필터)과 그 상품의 상세를 함께 다시 받는다.
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', target.id] });
            showToast('상품을 삭제했습니다');
          } catch (error) {
            showToast(error instanceof Error ? error.message : '상품 삭제에 실패했습니다.');
          }
          // 성공이든 실패든 닫는다 — 실패해도 창이 남으면 갇힌다.
          setDeleteTarget(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  backPressed: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heading: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  count: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
    marginTop: 2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    // 19바퀴(#786)에 #633F00 에서 홈 등록 단추와 같은 갈색으로 옮겼다.
    // 같은 「등록」인데 홈은 #825500, 여기는 #633F00 이라 화면마다 달랐다.
    backgroundColor: colors.action,
  },
  registerPressed: { opacity: 0.7 },
  registerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onAction,
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
