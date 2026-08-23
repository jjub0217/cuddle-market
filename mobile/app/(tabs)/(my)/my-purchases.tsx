import { Package } from 'lucide-react-native';
import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyPurchases } from '@/lib/my-lists';

// 내가 등록한 판매요청. 판매 내역과 같은 이유로 찜 버튼을 켜지 않는다(설계 §5).
// 문구는 웹 마이페이지 패널(`MyPagePanel.tsx` 의 tab-purchases)과 같은 값이다.
//
// ⚠️ **「구매」가 아니라 「판매요청」 갈래로 적는다.** 여기 실리는 것은 내가 **산 물건**이
//    아니라 내가 **올린 판매요청 글**이다. 「구매완료」로 되돌리지 마라 — 공용
//    `getTradeLabel`(packages/shared)도 REQUEST 에는 「요청완료」를 돌려준다.
//    웹도 같은 말로 맞춘다(`constants.ts` 의 nav-purchases 가 「판매요청 내역」이다).

export default function MyPurchasesScreen() {
  return (
    <MyProductList
      title="판매요청 내역"
      heading="내가 등록한 판매요청"
      queryKey={['my', 'purchases']}
      fetchPage={fetchMyPurchases}
      emptyIcon={Package}
      emptyTitle="등록한 판매요청이 없습니다"
      emptyDescription="판매요청을 등록해보세요"
      filterChips={[
        { id: 'ALL', label: '전체' },
        { id: 'SELLING', label: '요청중' },
        { id: 'COMPLETED', label: '요청완료' },
      ]}
      listKind="purchases"
      errorTitle="판매요청 내역을 불러오지 못했어요."
      registerLabel="판매요청 등록"
    />
  );
}
