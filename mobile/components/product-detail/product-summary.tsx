import {
  formatPrice,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type ProductDetailItem,
} from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

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
  // 뱃지: 판매=연파랑 알약, 판매요청=연주황 알약.
  // 웹 ProductBadge의 판매/판매요청 토큰과 짝을 이루는 같은 값이다(웹·앱 공통).
  // 근거: src/styles/tokens.colors.css 의 --color-badge-sell-* / --color-badge-request-*
  // 크기는 상세용(카드보다 큼): 좌우 8 / 상하 3 / 글자 12.
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSell: {
    backgroundColor: colors.badgeSellBg,
  },
  badgeRequest: {
    backgroundColor: colors.badgeRequestBg,
  },
  badgeOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSell: {
    color: colors.badgeSell,
  },
  badgeTextRequest: {
    color: colors.badgeRequest,
  },
  badgeTextOutline: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
  },
  title: {
    // 제목 20/700 = 가격과 크기·굵기 동일(사용자가 실물 보고 이 크기를 택함).
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: colors.onSurface,
  },
  price: {
    fontSize: 20,
    // 가격은 굵게(700) 강조. 제목과 크기·굵기가 같다(위 title 참고).
    fontWeight: '700',
    // 가격은 제목과 같은 검정(styles.title과 동일).
    color: colors.onSurface,
  },
  meta: {
    fontSize: 13,
    color: colors.onSurfaceMuted,
  },
});
