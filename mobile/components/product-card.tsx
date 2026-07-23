import { formatPrice, type Product } from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

import { ProductThumbnail } from '@/components/product-thumbnail';

// 가로형 상품 카드(UI 스펙 §4). 좌 썸네일 + 우 정보영역.
// 펫종류 없음, 찜="찜 N" 텍스트(표시전용, 토글 X). 카드 탭 액션 없음(범위 밖).

// 코드→이름 변환(웹 constants.ts와 동일 매핑). 없으면 코드 그대로 반환.
function getProductTypeLabel(code: string): string {
  if (code === 'SELL') return '판매';
  if (code === 'REQUEST') return '판매요청';
  return code;
}

function getProductStatusLabel(code: string): string {
  switch (code) {
    case 'NEW':
      return '새 상품';
    case 'LIKE_NEW':
      return '거의 새것';
    case 'USED':
      return '사용감 있음';
    case 'NEED_REPAIR':
      return '수리 필요';
    default:
      return code;
  }
}

// createdAt → "3시간 전" 상대시간(웹 getTimeAgo와 동일 로직).
function getTimeAgo(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${diffWeeks}주 전`;
  if (diffDays < 365) return `${diffMonths}개월 전`;

  const year = created.getFullYear();
  const month = String(created.getMonth() + 1).padStart(2, '0');
  const day = String(created.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

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

        {/* 제목 (최대 2줄) */}
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
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
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
