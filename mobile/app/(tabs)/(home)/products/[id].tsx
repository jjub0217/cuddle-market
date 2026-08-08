import type { Product, ProductDetailItem } from '@cuddle/shared';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useSegments, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { showToast } from '@/lib/toast';
import { ProductActionSheet, type SheetAction } from '@/components/my/product-action-sheet';
import { Breadcrumb } from '@/components/product-detail/breadcrumb';
import { DetailHeader } from '@/components/product-detail/detail-header';
import {
  DetailErrorState,
  DetailSkeleton,
  NotFoundState,
} from '@/components/product-detail/detail-states';
import { FavoriteButton } from '@/components/product-detail/favorite-button';
import { ImageCarousel } from '@/components/product-detail/image-carousel';
import { ProductSummary } from '@/components/product-detail/product-summary';
import { SellerCard } from '@/components/product-detail/seller-card';
import { BlockConfirm } from '@/components/report/block-confirm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMe } from '@/hooks/use-me';
import { buildOwnerActions } from '@/lib/product-menu';
import { tabGroupOf } from '@/lib/product-routes';
import { deleteProduct, fetchProductDetail, ProductNotFoundError } from '@/lib/products';

// 상품 상세. 읽기 전용.
// 화면 순서는 웹을 모바일 폭으로 줄였을 때와 같다:
//   브레드크럼 → 이미지 → 뱃지·제목·가격·시간·지역 → 판매자 → 설명 → 조회·찜
// 웹과 다른 곳은 한 군데 — 설명을 자체 스크롤 박스에 가두지 않는다(중첩 스크롤 회피).
//
// 헤더(DetailHeader)는 어느 상태에서도 늘 보인다. 로딩·오류·404일 때도 `‹`로 목록에
// 돌아갈 수 있어야 하기 때문. 그래서 상태별로 바뀌는 것은 헤더 아래 본문뿐이다.

// 홈 목록 캐시에서 같은 id의 상품을 찾아, 상세를 즉시 그릴 밑그림으로 쓴다.
// placeholderData의 함수 형태로 호출되므로 밑그림이 실제로 필요할 때만 실행된다
// (매 렌더마다 객체를 새로 만들지 않는다).
function readListCachePlaceholder(
  queryClient: QueryClient,
  id: number,
): ProductDetailItem | undefined {
  const pages = queryClient.getQueryData<{ pages: { content: Product[] }[] }>(['products']);
  const found = pages?.pages.flatMap((page) => page.content).find((p) => p.id === id);

  if (!found) return undefined;

  // 목록에 없는 값은 비워 둔다. 상세 응답이 오면 통째로 대체된다.
  return {
    ...found,
    category: '',
    description: '',
    subImageUrls: [],
    addressSido: found.addressSido ?? '',
    addressGugun: found.addressGugun ?? '',
    viewCount: found.viewCount ?? 0,
    sellerInfo: {
      sellerId: 0,
      sellerNickname: '',
      sellerProfileImageUrl: null,
      addressSido: null,
      addressGugun: null,
    },
    sellerOtherProducts: [],
  };
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // 이 화면은 홈·마이 두 스택에 다 있다(마이 것은 이 파일을 그대로 다시 내보낸다).
  // string[]으로 넓히는 이유는 seller-card.tsx에 적어 뒀다(튜플 유니온이라 공통 원소가 never).
  const segments = useSegments() as string[];
  const productId = Number(id);
  const queryClient = useQueryClient();

  const { data, isLoading, isPlaceholderData, error, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId),
    // 밑그림은 필요할 때만 목록 캐시에서 계산한다(매 렌더 객체 생성 회피).
    placeholderData: () => readListCachePlaceholder(queryClient, productId),
    // 없는 상품(404)은 다시 시도해도 소용없다.
    retry: (count, err) => !(err instanceof ProductNotFoundError) && count < 2,
  });

  const { data: me } = useMe();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const seller = data?.sellerInfo;
  // 상세 응답이 오기 전에는 목록 캐시로 만든 밑그림이 쓰이는데, 그 sellerInfo.sellerId는
  // 0인 자리표시자다(위 readListCachePlaceholder). 그때 ⋮ 를 그리면 0번 사용자를
  // 신고·차단하거나 남의 상품을 내 것으로 오인하게 된다.
  const isSellerKnown = Boolean(seller && seller.sellerId > 0);
  const isMine = Boolean(isSellerKnown && me && me.id === seller?.sellerId);
  // ⋮ 는 한 자리지만 안에 든 것이 갈린다:
  //   내 상품   수정하기 · 삭제      (내 것을 신고·차단할 이유가 없다)
  //   남의 상품 상품 신고하기 · 판매자 차단하기
  const canReport = isSellerKnown && !isMine;
  const canManage = isMine;

  /** 내 상품이면 관리 항목, 아니면 신고 항목. 문구는 lib/product-menu.ts와 같은 값이다. */
  const buildSheetActions = (): SheetAction[] => {
    if (!data) return [];

    if (canManage) {
      // 무엇을 보일지는 마이 목록과 같은 규칙 함수가 정한다 —
      // 끝난 거래에는 「수정하기」가 빠진다(웹과 같다). 규칙이 한 곳에만 있어야
      // 들어온 자리에 따라 메뉴가 달라지지 않는다.
      // 상세에는 거래 상태를 바꾸는 자리가 없으므로 그 항목만 걸러낸다.
      return buildOwnerActions('sales', data.tradeStatus)
        .filter((action) => action.kind !== 'status')
        .map((action): SheetAction =>
          action.kind === 'edit'
            ? {
                label: action.label,
                onPress: () => {
                  setIsSheetOpen(false);
                  // from: 수정 화면은 루트 스택이라 어느 탭에서 열렸는지 모른다. 끝나고
                  // 이 탭의 상세로 돌아오게 하려면 지금 그룹을 알려 줘야 한다.
                  router.push(`/products/${productId}/edit?from=${tabGroupOf(segments)}` as Href);
                },
              }
            : {
                label: action.label,
                tone: action.tone,
                onPress: () => {
                  // 시트를 먼저 닫고 확인 창을 연다. 두 개가 겹쳐 뜨지 않게.
                  setIsSheetOpen(false);
                  setIsDeleteOpen(true);
                },
              }
        );
    }

    return [
      {
        label: '상품 신고하기',
        onPress: () => {
          setIsSheetOpen(false);
          router.push({
            pathname: '/report',
            params: { kind: 'product', id: String(productId), name: data.title },
          });
        },
      },
      {
        label: '판매자 차단하기',
        tone: 'danger',
        onPress: () => {
          setIsSheetOpen(false);
          setIsBlockOpen(true);
        },
      },
    ];
  };

  // 로딩·오류·본문은 서로 섞지 않는다(홈 index.tsx의 renderBody와 같은 결).
  const renderBody = () => {
    if (error instanceof ProductNotFoundError) {
      return <NotFoundState onBack={() => router.back()} />;
    }
    if (error) {
      return <DetailErrorState onRetry={() => refetch()} />;
    }
    if (isLoading || !data) {
      return <DetailSkeleton />;
    }

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {data.category ? (
          <View style={styles.breadcrumbWrap}>
            <Breadcrumb petDetailType={data.petDetailType} category={data.category} />
          </View>
        ) : null}

        <ImageCarousel
          mainImageUrl={data.mainImageUrl}
          subImageUrls={data.subImageUrls}
          tradeStatus={data.tradeStatus}
          productType={data.productType}
        />

        <View style={styles.section}>
          <ProductSummary product={data} />
        </View>

        <View style={styles.divider} />

        {/* 상세 응답이 오기 전(밑그림 상태)에는 설명·판매자 칸을 회색 자리로 둔다.
            밑그림 여부는 TanStack Query가 알려주는 isPlaceholderData로 판단한다. */}
        <View style={styles.section}>
          {isPlaceholderData ? <View style={styles.bar} /> : <SellerCard seller={data.sellerInfo} />}
        </View>

        {/* 밑그림 상태에서는 아직 isFavorite을 모른다. 버튼을 그리면 하트가
            빈 채로 보였다가 갑자기 채워져 깜빡인다. 실제 응답이 온 뒤에만 그린다. */}
        {isPlaceholderData ? null : (
          <View style={styles.section}>
            <FavoriteButton productId={data.id} isFavorite={data.isFavorite} />
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.section}>
          {isPlaceholderData ? (
            <View style={[styles.bar, { width: '70%' }]} />
          ) : (
            <Text style={styles.description}>{data.description}</Text>
          )}
        </View>

        {/* 조회·찜은 누를 수 없는 정보라 아이콘 없이 글자로만 둔다.
            (아이콘은 누를 수 있는 것에만 쓴다) */}
        <View style={styles.section}>
          <Text style={styles.counts}>{`조회 ${data.viewCount} · 찜 ${data.favoriteCount}`}</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DetailHeader
        onMorePress={canReport || canManage ? () => setIsSheetOpen(true) : undefined}
      />
      {renderBody()}

      {data && seller ? (
        <>
          <ProductActionSheet
            visible={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            actions={buildSheetActions()}
          />
          <BlockConfirm
            visible={isBlockOpen}
            nickname={seller.sellerNickname}
            userId={seller.sellerId}
            onClose={() => setIsBlockOpen(false)}
            onDone={() => {
              setIsBlockOpen(false);
              showToast('차단했습니다');
            }}
          />
          {/* 문구는 웹 삭제 확인 창 그대로다. 지우면 뒤로 간다 —
              지운 상품 화면에 서 있을 수 없다. */}
          <ConfirmDialog
            visible={isDeleteOpen}
            heading="상품 삭제"
            description="정말로 이 상품을 삭제하시겠습니까?"
            notes={['삭제된 상품은 복구할 수 없습니다']}
            confirmLabel="삭제하기"
            tone="danger"
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={async () => {
              try {
                await deleteProduct(productId);
                queryClient.invalidateQueries({ queryKey: ['products'] });
                queryClient.invalidateQueries({ queryKey: ['my'] });
                setIsDeleteOpen(false);
                showToast('상품을 삭제했습니다');
                router.back();
                return;
              } catch (error) {
                showToast(error instanceof Error ? error.message : '상품 삭제에 실패했습니다.');
              }
              // 실패해도 닫는다 — 창이 남으면 갇힌다.
              setIsDeleteOpen(false);
            }}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  breadcrumbWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
  },
  counts: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
  bar: {
    height: 40,
    width: '45%',
    borderRadius: 4,
    backgroundColor: colors.outlineVariant,
  },
});
