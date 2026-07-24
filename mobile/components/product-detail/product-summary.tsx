import {
  formatPrice,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type ProductDetailItem,
} from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

// 뱃지 → 제목 → 가격 → 시간·지역. 웹 모바일 폭과 같은 순서.
// 뱃지 색은 홈 카드와 같다(판매=파랑, 판매요청=주황).

interface Props {
  product: ProductDetailItem;
}

export function ProductSummary({ product }: Props) {
  const isRequest = product.productType === 'REQUEST';
  const location = [product.addressSido, product.addressGugun].filter(Boolean).join(' ');

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, isRequest ? styles.badgeRequest : styles.badgeSell]}>
          <Text style={[styles.badgeText, isRequest ? styles.badgeTextRequest : styles.badgeTextSell]}>
            {getProductTypeLabel(product.productType)}
          </Text>
        </View>
        {product.productStatus ? (
          <View style={[styles.badge, styles.badgeOutline]}>
            <Text style={styles.badgeTextOutline}>{getProductStatusLabel(product.productStatus)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>{`${formatPrice(product.price)}원`}</Text>
      <Text style={styles.meta}>
        {getTimeAgo(product.createdAt)}
        {location ? ` · ${location}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSell: {
    backgroundColor: '#EFF6FF',
  },
  badgeRequest: {
    backgroundColor: '#FFF7ED',
  },
  badgeOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSell: {
    color: '#2563EB',
  },
  badgeTextRequest: {
    color: '#EA580C',
  },
  badgeTextOutline: {
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#111827',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA580C',
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
  },
});
