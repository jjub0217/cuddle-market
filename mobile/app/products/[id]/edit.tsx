import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { ProductForm } from '@/components/products/product-form';
import { ErrorState, LoadingState } from '@/components/list-states';
import { colors } from '@/constants/colors';
import { productDetailHref, tabGroupOf } from '@/lib/product-routes';
import { fetchProductDetail, updateProduct, type ProductPayload } from '@/lib/products';
import { showToast } from '@/lib/toast';

// 상품 수정. 등록 화면과 같은 폼을 쓰고, 처음 값만 서버에서 받아 채운다.
// 루트 스택이라 탭바가 안 보인다 — 끝내고 나가는 화면이다(등록·신고와 같은 판단).
//
// ⚠️ 수정은 전체 교체다(PATCH지만 서버가 안 담긴 값을 비운다).
//    그래서 폼이 보내는 값 하나하나가 상세 응답에서 제대로 채워져야 한다.

export default function EditProductScreen() {
  // from: 어느 탭에서 열렸는지. 이 화면은 루트 스택이라 스스로는 알 수 없어서 넘겨받는다
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const productId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId),
  });

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      await updateProduct(productId, payload);
      // 상세와 판매 내역이 새 값을 받게 한다.
      // 키는 실제로 쓰는 값 그대로다 — 상세는 (home)/products/[id].tsx:73,
      // 판매 내역은 my-products.tsx의 ['my', 'products'].
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['my', 'products'] });

      // 목록이 아니라 **상세로** 보낸다. 수정은 전체 교체라 「가격만 바꿨는데 사진·설명이
      // 날아가지 않았나」를 눈으로 확인할 자리가 필요하다 — 목록에는 가격·제목만 보인다.
      // 웹도 수정 뒤 상세로 간다(ProductPostForm.tsx:101).
      //
      // dismissTo인 이유: 상세 → 수정으로 왔으면 **그 상세로 되돌아가** 상세가 두 겹 쌓이지
      // 않고, 판매 내역 → 수정으로 왔으면 수정 화면을 상세로 갈아끼운다(뒤로 = 판매 내역).
      router.dismissTo(productDetailHref(tabGroupOf(from), productId) as Href);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '상품 수정에 실패했습니다.');
    }
  };

  // ⚠️ 값이 도착하기 전에는 폼을 안 그린다.
  //    initialValues는 처음 그릴 때 한 번만 읽히므로(ProductForm의 useState 초깃값),
  //    빈 값으로 먼저 그리면 나중에 값이 와도 칸이 안 채워진다.
  //    웹 ProductPost.tsx:89-95도 같은 이유로 데이터가 올 때까지 폼을 안 그린다.
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => router.back()} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => router.back()} />
        <ErrorState onRetry={() => refetch()} title="상품을 불러오지 못했어요." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={() => router.back()} />

      <ProductForm
        initialValues={{
          title: product.title,
          description: product.description ?? '',
          // 입력칸은 글자를 다루므로 숫자를 글자로 바꿔 넣는다
          price: String(product.price),
          // 상세 응답에 petType이 온다(서버 ProductDetailResponse:28).
          // 공유 타입에서만 선택값이라 ?? ''를 두지만, 비면 검사가 막아 준다
          petType: product.petType ?? '',
          petDetailType: product.petDetailType,
          category: product.category,
          productStatus: product.productStatus,
          addressSido: product.addressSido,
          addressGugun: product.addressGugun,
        }}
        // 이미 올라간 사진은 서버 주소가 곧 미리보기 주소다.
        // ⚠️ 사진이 한 장뿐이면 서버가 subImageUrls를 null로 준다
        initialSlots={[product.mainImageUrl, ...(product.subImageUrls ?? [])]
          .filter((url): url is string => Boolean(url))
          .map((url, index) => ({ key: `existing-${index}`, localUri: url, url, failed: false }))}
        submitLabel="수정 완료"
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

/** 헤더는 화면이 직접 그린다(신고·등록 화면과 같은 이유). 세 상태가 다 같은 헤더를 쓴다 */
function Header({ onBack }: { onBack: () => void }) {
  return (
    <ScreenHeader title="상품 수정" onPressIcon={onBack} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
});
