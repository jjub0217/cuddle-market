import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductForm } from '@/components/products/product-form';
import type { ProductFormValues } from '@/lib/product-form';
import { createProduct, type ProductPayload } from '@/lib/products';
import { showToast } from '@/lib/toast';

// 상품 등록. 루트 스택이라 탭바가 안 보인다 — 끝내고 나가는 화면이다
// (신고·댓글 스레드와 같은 판단).
//
// 헤더 제목은 「상품 등록」이다. 웹은 「판매 상품 등록」이지만 앱은 판매 요청을 안 만들어서
// 「판매 상품」이라고 구별할 이유가 없다.

const HEADER_HEIGHT = 52; // 앱의 다른 헤더와 같은 값

/** 빈 폼. 고르는 값은 빈 글자로 두면 PickerField가 안내 문구를 보여준다 */
const EMPTY_VALUES: ProductFormValues = {
  title: '',
  description: '',
  price: '',
  petType: '',
  petDetailType: '',
  category: '',
  productStatus: '',
  addressSido: '',
  addressGugun: '',
};

export default function NewProductScreen() {
  const router = useRouter();

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      const id = await createProduct(payload);
      // 만든 상품을 바로 보여준다. 목록으로 보내면 자기 글을 또 찾아야 한다.
      // ⚠️ replace다. push면 뒤로가기가 방금 다 채운 등록 화면으로 돌아간다.
      router.replace(`/(tabs)/(home)/products/${id}`);
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
