import { Package } from 'lucide-react-native';
import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyProducts } from '@/lib/my-lists';

// 내가 등록한 판매 상품. 관리용 화면이라 찜 버튼을 켜지 않는다 —
// 5바퀴에서 이 자리에 거래 상태 변경 · 삭제가 들어온다(설계 §5).
// 문구는 웹 마이페이지 패널(MyPagePanel의 tab-sales)과 같은 값이다.

export default function MyProductsScreen() {
  return (
    <MyProductList
      title="판매 내역"
      heading="내가 등록한 상품"
      queryKey={['my', 'products']}
      fetchPage={fetchMyProducts}
      emptyIcon={Package}
      emptyTitle="등록한 상품이 없습니다"
      emptyDescription="상품을 등록해보세요"
      filterChips={[
        { id: 'ALL', label: '전체' },
        { id: 'SELLING', label: '판매중' },
        { id: 'RESERVED', label: '예약중' },
        { id: 'COMPLETED', label: '판매완료' },
      ]}
      listKind="sales"
      errorTitle="판매 내역을 불러오지 못했어요."
      registerLabel="상품 등록"
    />
  );
}
