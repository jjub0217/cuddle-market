import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyPurchases } from '@/lib/my-lists';

// 내가 등록한 구매 요청. 판매 내역과 같은 이유로 찜 버튼을 켜지 않는다(설계 §5).
// 문구는 웹 마이페이지 패널(MyPagePanel의 tab-purchases)과 같은 값이다.

export default function MyPurchasesScreen() {
  return (
    <MyProductList
      title="구매 내역"
      heading="내가 등록한 구매 요청"
      queryKey={['my', 'purchases']}
      fetchPage={fetchMyPurchases}
      emptyIcon="shippingbox"
      emptyTitle="등록한 구매 요청이 없습니다"
      emptyDescription="구매 요청을 등록해보세요"
      listKind="purchases"
      errorTitle="구매 내역을 불러오지 못했어요."
      registerLabel="판매요청 등록"
    />
  );
}
