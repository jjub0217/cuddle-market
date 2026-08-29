import ProductDetailScreen from '@/app/(tabs)/(home)/products/[id]';

// 마이 스택에서 여는 상품 상세.
//
// 화면은 홈 것과 똑같다. 파일을 하나 더 두는 이유는 **어느 스택에 쌓이느냐**가 다르기 때문이다.
// 상세가 홈 스택에만 있으면, 찜 목록에서 상품을 눌렀을 때 expo-router가 홈 탭으로 옮겨간 뒤
// 거기에 상세를 쌓는다. 그래서 뒤로 가면 찜 목록이 아니라 홈이 나온다(실기기에서 확인).
//
// 두 스택에 각각 두면 온 자리로 되돌아간다. 대신 주소가 두 곳에 생기므로
// 미는 쪽이 그룹까지 적어야 한다 — `/(tabs)/my/products/1` 처럼.
export default ProductDetailScreen;
