import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductForm } from '@/components/products/product-form';
import { DEFAULT_PRODUCT_STATUS, type ProductFormValues } from '@/lib/product-form';
import { productDetailHref, tabGroupOf } from '@/lib/product-routes';
import { createProduct, type ProductPayload } from '@/lib/products';
import { showToast } from '@/lib/toast';

// 상품 등록. 루트 스택이라 탭바가 안 보인다 — 끝내고 나가는 화면이다
// (신고·댓글 스레드와 같은 판단).
//
// 헤더 제목은 「상품 등록」이다. 웹은 「판매 상품 등록」이지만 앱은 판매 요청을 안 만들어서
// 「판매 상품」이라고 구별할 이유가 없다.

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값

/**
 * 빈 폼. 고르는 값은 빈 글자로 두면 PickerField가 안내 문구를 보여준다.
 *
 * ⚠️ 상품 상태만 예외로 **미리 골라 둔다**(NEW).
 *    서버에는 기본값이 없다 — enum에도, 엔티티에도 없고 요청 DTO가 @NotNull로 막는다
 *    (ProductCreateRequest.java:46). 웹도 빈 값으로 시작한다.
 *    그러니 이건 서버를 따른 게 아니라 **앱에서 정한 값**이다. 알약을 펼쳐 두면서
 *    하나도 안 채워져 있으면 빈 줄처럼 보여, 맨 앞 값을 채워 두기로 했다.
 */
const EMPTY_VALUES: ProductFormValues = {
  title: '',
  description: '',
  price: '',
  petType: '',
  petDetailType: '',
  category: '',
  productStatus: DEFAULT_PRODUCT_STATUS,
  addressSido: '',
  addressGugun: '',
};

export default function NewProductScreen() {
  const router = useRouter();
  // from: 어느 탭에서 열렸는지. 이 화면은 루트 스택이라 스스로는 알 수 없어서 넘겨받는다
  // (수정 화면과 같은 방식이다).
  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      const id = await createProduct(payload);
      // 만든 상품을 바로 보여준다. 목록으로 보내면 자기 글을 또 찾아야 한다.
      //
      // ⚠️ **닫고 나서 쌓는다.** replace로 탭 주소를 바로 넣으면 탭이 두 겹이 된다 —
      //    루트 스택이 [(tabs), (tabs)]가 되고, 새로 쌓인 탭의 홈 스택에는 상세 하나뿐이라
      //    **홈 탭을 눌러도 아무 일이 안 일어난다**(2026-08-04 실기기).
      //    dismissAll로 등록 화면을 닫아 원래 탭으로 돌아간 뒤, 그 탭 안에 상세를 쌓는다.
      const detail = productDetailHref(tabGroupOf(from), id) as Href;

      if (router.canDismiss()) {
        router.dismissAll();
        // ⚠️ **한 박자 늦춰서** 쌓는다. 같은 순간에 부르면 push가 「닫기 전 상태」를 보고
        //    루트 스택에 얹혀 탭이 또 두 겹이 된다(2026-08-04 실기기에서 그랬다).
        setTimeout(() => router.push(detail), 0);
        return;
      }

      router.push(detail);
    } catch (error) {
      // 화면을 안 닫는다 — 적어 둔 값이 남아 있어야 다시 낼 수 있다
      showToast(error instanceof Error ? error.message : '상품 등록에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 헤더는 화면이 직접 그린다(신고 화면과 같은 이유) */}
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
        <Text style={styles.heading}>상품 등록</Text>
      </View>

      <ProductForm
        initialValues={EMPTY_VALUES}
        initialSlots={[]}
        submitLabel="등록하기"
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#111827' },
  pressed: { opacity: 0.5 },
});
