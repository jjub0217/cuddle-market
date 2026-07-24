import {
  formatPrice,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type Product,
} from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

import { ProductThumbnail } from '@/components/product-thumbnail';

// 가로형 상품 카드(UI 스펙 §4). 좌 썸네일 + 우 정보영역.
// 펫종류 없음, 찜="찜 N" 텍스트(표시전용, 토글 X).
// 코드→한글 변환과 상대시간은 @cuddle/shared에서 가져온다(웹과 같은 원본).

// 제목 한 줄의 높이(fontSize 15 기준). 카드 높이를 균일하게 맞추는 기준값이라 상수로 둔다.
const TITLE_LINE_HEIGHT = 20;

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const location = product.addressGugun || product.addressSido || '';
  const isRequest = product.productType === 'REQUEST';

  return (
    <View style={styles.card}>
      <ProductThumbnail
        imageUrl={product.mainImageUrl}
        tradeStatus={product.tradeStatus}
        productType={product.productType}
      />

      <View style={styles.info}>
        {/* 뱃지 행: 판매유형 + 상품상태 */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isRequest ? styles.badgeRequest : styles.badgeSell]}>
            <Text style={[styles.badgeText, isRequest ? styles.badgeTextRequest : styles.badgeTextSell]}>
              {getProductTypeLabel(product.productType)}
            </Text>
          </View>
          {product.productStatus ? (
            <View style={[styles.badge, styles.badgeOutline]}>
              <Text style={styles.badgeTextOutline}>
                {getProductStatusLabel(product.productStatus)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 제목 (최대 2줄, 넘치면 말줄임)
            제목이 1줄이어도 2줄 자리를 늘 차지한다(styles.title의 minHeight).
            그래야 카드 높이가 전부 같아지고, 카드 높이를 따라가는 썸네일 크기도 균일해진다. */}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {/* 가격 (강조) — 단위는 화면에서 붙인다 */}
        <Text style={styles.price}>{`${formatPrice(product.price)}원`}</Text>

        {/* 메타 행: 위치 · 찜 N …… 상대시간(오른쪽 끝) */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {location ? `${location} · ` : ''}
            {`찜 ${product.favoriteCount}`}
          </Text>
          <Text style={styles.metaTime}>{getTimeAgo(product.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    // 카드에 안쪽 패딩을 두지 않아 썸네일이 위·아래·좌측에 꽉 찬다(웹 모바일 카드와 같은 구조).
    // 라운드 밖으로 삐져나온 썸네일 모서리는 overflow로 잘라낸다.
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    // 여백은 카드가 아니라 글자 영역만 갖는다(썸네일과의 간격도 여기 paddingLeft가 만든다).
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeSell: {
    backgroundColor: '#EFF6FF', // 판매: 차분한 파랑 톤
  },
  badgeRequest: {
    backgroundColor: '#FFF7ED', // 판매요청: 눈에 띄는 주황 톤
  },
  badgeOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSell: {
    color: '#2563EB',
  },
  badgeTextRequest: {
    color: '#EA580C',
  },
  badgeTextOutline: {
    fontSize: 11,
    color: '#6B7280',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    // 줄 높이를 명시해야(기기·플랫폼 기본값이 제각각) 2줄 자리를 정확히 계산할 수 있다.
    lineHeight: TITLE_LINE_HEIGHT,
    // 1줄짜리 제목도 2줄 자리를 차지해 카드 높이를 일정하게 만든다.
    minHeight: TITLE_LINE_HEIGHT * 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  metaTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
