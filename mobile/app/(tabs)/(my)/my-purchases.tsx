import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyPurchases } from '@/lib/my-lists';

// 내가 등록한 구매 요청. 판매 내역과 같은 이유로 찜 버튼을 켜지 않는다(설계 §5).

export default function MyPurchasesScreen() {
  return (
    <MyProductList
      title="구매 내역"
      queryKey={['my', 'purchases']}
      fetchPage={fetchMyPurchases}
      emptyTitle="구매 요청한 상품이 없어요."
      emptyDescription="구매 요청을 올리면 여기에서 볼 수 있어요."
      errorTitle="구매 내역을 불러오지 못했어요."
    />
  );
}
