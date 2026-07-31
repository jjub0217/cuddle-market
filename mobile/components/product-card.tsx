import {
  formatPrice,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type Product,
} from '@cuddle/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductThumbnail, type FavoriteControl } from '@/components/product-thumbnail';
import { EllipsisVertical } from 'lucide-react-native';

// 가로형 상품 카드(UI 스펙 §4). 좌 썸네일 + 우 정보영역.
// 펫종류 없음, 찜="찜 N" 텍스트는 개수(정보). 켜고 끄는 것은 썸네일 위 찜 버튼이 맡는다(설계 §5).
// 코드→한글 변환과 상대시간은 @cuddle/shared에서 가져온다(웹과 같은 원본).

// 제목 한 줄의 높이(fontSize 15 기준). 카드 높이를 균일하게 맞추는 기준값이라 상수로 둔다.
const TITLE_LINE_HEIGHT = 20;

interface Props {
  product: Product;
  /** 넘기면 썸네일에 찜 버튼이 붙는다. 카드는 그대로 전달만 한다. */
  favorite?: FavoriteControl;
  /** 넘기면 오른쪽 위에 ⋮ 가 붙는다. 관리하는 목록(판매 · 구매)만 넘긴다. */
  onMorePress?: () => void;
}

export function ProductCard({ product, favorite, onMorePress }: Props) {
  const location = product.addressGugun || product.addressSido || '';
  const isRequest = product.productType === 'REQUEST';

  return (
    <View style={styles.card}>
      <ProductThumbnail
        imageUrl={product.mainImageUrl}
        tradeStatus={product.tradeStatus}
        productType={product.productType}
        favorite={favorite}
      />

      <View style={styles.info}>
        {onMorePress ? (
          <Pressable
            onPress={onMorePress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="상품 관리 메뉴 열기"
            style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
          >
            <EllipsisVertical size={20} color="#9CA3AF" />
          </Pressable>
        ) : null}

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
  // 뱃지: 판매=연파랑 알약, 판매요청=연주황 알약.
  // 웹 ProductBadge의 판매/판매요청 토큰과 짝을 이루는 같은 값이다(웹·앱 공통).
  // 근거: src/styles/tokens.colors.css 의 --color-badge-sell-* / --color-badge-request-*
  // 크기는 카드용(작게): 좌우 8 / 상하 2 / 글자 11.
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    // 같은 줄의 타입 뱃지(badgeText)와 글자 크기를 맞춘다.
    fontSize: 11,
    color: '#6B7280',
  },
  more: {
    // 정보 영역 오른쪽 위. 제목이 길어져도 자리를 뺏기지 않게 절대 배치로 띄운다.
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  morePressed: {
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
    // 줄 높이를 명시해야(기기·플랫폼 기본값이 제각각) 2줄 자리를 정확히 계산할 수 있다.
    lineHeight: TITLE_LINE_HEIGHT,
    // ⋮ 가 붙는 화면에서 제목이 그 아래로 파고들지 않게. 없는 화면에서도 빈 여백일 뿐이다.
    paddingRight: 28,
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
