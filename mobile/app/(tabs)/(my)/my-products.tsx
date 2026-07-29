import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyProducts } from '@/lib/my-lists';

// 내가 등록한 판매 상품. 관리용 화면이라 찜 버튼을 켜지 않는다 —
// 5바퀴에서 이 자리에 거래 상태 변경 · 삭제가 들어온다(설계 §5).

export default function MyProductsScreen() {
  return (
    <MyProductList
      title="판매 내역"
      queryKey={['my', 'products']}
      fetchPage={fetchMyProducts}
      emptyTitle="등록한 상품이 없어요."
      emptyDescription="상품을 등록하면 여기에서 볼 수 있어요."
      errorTitle="판매 내역을 불러오지 못했어요."
    />
  );
}
