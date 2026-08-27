import { Heart } from 'lucide-react-native';
import { MyProductList } from '@/components/my/my-product-list';
import { fetchMyFavorites } from '@/lib/my-lists';

// 찜한 상품. 여기서만 카드에 찜 버튼을 켠다 —
// 찜을 빼는 것이 이 화면의 주 목적이다(설계 §5).
// 문구는 웹 마이페이지 패널(MyPagePanel의 tab-wishlist)과 같은 값이다.

export default function FavoritesScreen() {
  return (
    <MyProductList
      title="찜한 상품"
      heading="내가 찜한 상품"
      queryKey={['my', 'favorites']}
      fetchPage={fetchMyFavorites}
      emptyIcon={Heart}
      emptyTitle="찜한 상품이 없습니다"
      emptyDescription="마음에 드는 상품을 찜해보세요"
      errorTitle="찜한 상품을 불러오지 못했어요."
      showFavorite
    />
  );
}
