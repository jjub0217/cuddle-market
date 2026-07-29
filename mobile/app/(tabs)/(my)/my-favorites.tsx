import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyFavorites } from '@/lib/my-lists';

// 찜한 상품. 여기서만 카드에 찜 버튼을 켠다 —
// 찜을 빼는 것이 이 화면의 주 목적이다(설계 §5).

export default function FavoritesScreen() {
  return (
    <MyProductList
      title="찜한 상품"
      queryKey={['my', 'favorites']}
      fetchPage={fetchMyFavorites}
      emptyTitle="찜한 상품이 없어요."
      emptyDescription="마음에 드는 상품에 하트를 눌러보세요."
      errorTitle="찜한 상품을 불러오지 못했어요."
      showFavorite
    />
  );
}
