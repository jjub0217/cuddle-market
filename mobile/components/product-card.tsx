import {
  formatPrice,
  getPriceLabel,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type Product,
} from '@cuddle/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductThumbnail, type FavoriteControl } from '@/components/product-thumbnail';
import { colors } from '@/constants/colors';
import { getOverlay } from '@/lib/tradeStatus';
import { EllipsisVertical, Heart } from 'lucide-react-native';

// 가로형 상품 카드(UI 스펙 §4). 좌 썸네일 + 우 정보영역.
// ⚠️ **판매요청 카드는 썸네일이 없다**(#1109) — 글자 영역만으로 한 줄이 된다. 아래 주석 참고.
// 펫종류 없음, 찜="찜 N" 텍스트는 개수(정보). 켜고 끄는 것은 찜 버튼이 맡는다(설계 §5) —
// 판매 카드는 썸네일 위, 판매요청 카드는 글자 영역 오른쪽 위.
// 코드→한글 변환과 상대시간은 @cuddle/shared에서 가져온다(웹과 같은 원본).

// 제목 한 줄의 높이(fontSize 15 기준). 카드 높이를 균일하게 맞추는 기준값이라 상수로 둔다.
const TITLE_LINE_HEIGHT = 20;

interface Props {
  product: Product;
  /**
   * 넘기면 찜 버튼이 붙는다. 판매 카드는 썸네일 위에(전달만 한다), 판매요청 카드는
   * 썸네일이 없어서 글자 영역 오른쪽 위에 카드가 직접 그린다.
   */
  favorite?: FavoriteControl;
  /** 넘기면 오른쪽 위에 ⋮ 가 붙는다. 관리하는 목록(판매 내역 · 판매요청 내역)만 넘긴다. */
  onMorePress?: () => void;
}

export function ProductCard({ product, favorite, onMorePress }: Props) {
  const location = product.addressGugun || product.addressSido || '';
  const isRequest = product.productType === 'REQUEST';
  // 판매요청이면 「희망」. 판매면 null 이라 안 그린다(#1113)
  const priceLabel = getPriceLabel(product.productType);

  // 판매요청(「구해요」) 글의 사진은 **내 물건이 아니라 남의 물건을 퍼온 예시**다.
  // 판매글 사진과 뜻이 다른데 같은 자리에 들어가고, 사진이 없으면 회색 네모가 남아
  // 「사진이 있어야 하는데 없다 = 깨졌다」로 읽힌다. 그래서 요청 카드는 썸네일 자리를
  // 아예 안 그린다(#1109). 사진은 채팅으로 주고받는다.
  // 웹도 같은 자리를 안 그린다 — `ProductCard.tsx` 의 `isRequest`.
  //
  // ⚠️ 한글 이름이 아니라 **원본 코드**('REQUEST')로 가른다. 문구가 바뀌어도 안 깨진다.

  // 썸네일을 안 그리면 거기 얹히던 거래상태 오버레이(예약중 · 요청완료)도 같이 사라진다.
  // 그러면 「전체」로 볼 때 끝난 요청과 도는 요청이 똑같아 보인다 — 그래서 요청 카드만
  // 그 값을 뱃지 줄로 옮겨 글자로 그린다.
  // 「언제 그리나」는 썸네일과 같은 규칙 하나(`lib/tradeStatus.ts` 의 `getOverlay`)에 맡긴다:
  // 판매중 · 요청중이면 null 이라 안 그리고, 예약중 · 완료계열이면 그 라벨을 그대로 쓴다.
  const tradeBadge = isRequest ? getOverlay(product.tradeStatus, product.productType) : null;

  // 찜 버튼도 썸네일 안에 있어서 같이 사라진다. 그런데 판매요청도 찜할 수 있고
  // (홈 목록의 「판매요청」 탭 · 찜한 상품 목록에 그대로 실린다), 특히 찜한 상품에서
  // 하트가 없으면 **뺄 방법이 없어진다.** 그래서 글자 영역 오른쪽 위로 옮긴다.
  //
  // ⚠️ ⋮ 와 같은 자리다. 지금은 둘이 같이 오는 화면이 없다 — 찜 버튼은 홈 · 찜한 상품,
  //    ⋮ 는 판매 내역 · 판매요청 내역이라 서로 안 겹친다. 둘을 같이 넘기게 되면
  //    자리를 새로 잡아야 한다(제목의 paddingRight 도 단추 하나 몫만 비워 뒀다).
  const showInfoFavorite = isRequest && favorite != null;

  return (
    <View style={styles.card}>
      {isRequest ? null : (
        <ProductThumbnail
          imageUrl={product.mainImageUrl}
          tradeStatus={product.tradeStatus}
          productType={product.productType}
          favorite={favorite}
        />
      )}

      <View style={styles.info}>
        {showInfoFavorite && favorite ? (
          <Pressable
            onPress={favorite.onToggle}
            disabled={favorite.disabled}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ selected: favorite.isFavorite }}
            accessibilityLabel={favorite.isFavorite ? '찜 해제' : '찜하기'}
            style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
          >
            {/* 사진 위가 아니라 흰 바탕이라 그림자 하트를 안 깐다(썸네일 쪽 주석 참고).
                안 찜한 상태는 흰색 대신 보조 글자색을 쓴다 — 흰 바탕에서 흰 하트는 안 보인다. */}
            <Heart
              size={20}
              color={favorite.isFavorite ? colors.favorite : colors.onSurfaceSubtle}
              fill={favorite.isFavorite ? colors.favorite : 'none'}
            />
          </Pressable>
        ) : null}

        {onMorePress ? (
          <Pressable
            onPress={onMorePress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="상품 관리 메뉴 열기"
            style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
          >
            <EllipsisVertical size={20} color={colors.onSurfaceSubtle} />
          </Pressable>
        ) : null}

        {/* 뱃지 행: 판매유형 + (요청 카드만) 거래상태 + 상품상태 */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isRequest ? styles.badgeRequest : styles.badgeSell]}>
            <Text style={[styles.badgeText, isRequest ? styles.badgeTextRequest : styles.badgeTextSell]}>
              {getProductTypeLabel(product.productType)}
            </Text>
          </View>
          {tradeBadge ? (
            <View style={[styles.badge, styles.badgeTrade]}>
              <Text style={styles.badgeTextTrade}>{tradeBadge.label}</Text>
            </View>
          ) : null}
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

        {/* 가격 (강조) — 단위는 화면에서 붙인다.
            판매요청이면 앞에 「희망」이 붙는다(#1113). 같은 「12,000원」이 판매는
            "이 값에 팝니다", 판매요청은 "이 값에 사고 싶어요"로 뜻이 반대인데
            카드만 보면 안 갈려서다. 웹 카드도 같은 함수를 쓴다 — `ProductHeading`.

            ⚠️ 「희망」은 **값보다 작게** 그린다(styles.priceLabel). 값과 같은 크기로
               두면 제목과 한 덩어리로 읽힌다 — 상세에서 실제로 그랬다. */}
        <Text style={styles.price}>
          {priceLabel ? <Text style={styles.priceLabel}>{priceLabel} </Text> : null}
          {`${formatPrice(product.price)}원`}
        </Text>

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
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
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
    // ⋮ · 찜 하트 자리를 비켜 둔다(제목의 paddingRight 와 같은 값·같은 까닭).
    // 요청 카드는 뱃지가 셋까지 늘어나서(판매요청 | 요청완료 | 사용감 있음) 줄이 길어진다.
    // 기본 글꼴에서는 360dp 폰에서도 70dp 넘게 남지만, **글꼴을 크게 쓰는 설정**에서는
    // 좁은 폰에서 단추 밑으로 파고들 수 있다 — 그때 겹치는 대신 아랫줄로 접히게 한다.
    // ⚠️ 접히는 것은 그 극단에서만이다. 보통은 지금과 똑같이 한 줄이다.
    flexWrap: 'wrap',
    paddingRight: 28,
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
    backgroundColor: colors.badgeSellBg,
  },
  badgeRequest: {
    backgroundColor: colors.badgeRequestBg,
  },
  badgeOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
  },
  // 거래상태 뱃지(요청 카드에만). 썸네일 오버레이의 「어두운 막 + 흰 알약」을 뒤집어
  // 흰 바탕 위에서 같은 무게가 되게 먹색 알약 + 흰 글자로 둔다.
  // 같은 줄의 다른 둘(연한 알약 · 테두리만)과 확실히 갈라져 「상태」로 읽힌다.
  badgeTrade: {
    backgroundColor: colors.onSurface,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSell: {
    color: colors.badgeSell,
  },
  badgeTextRequest: {
    color: colors.badgeRequest,
  },
  badgeTextTrade: {
    // 같은 줄의 다른 뱃지 글자와 크기·굵기를 맞춘다.
    fontSize: 11,
    fontWeight: '600',
    color: colors.surface,
  },
  badgeTextOutline: {
    // 같은 줄의 타입 뱃지(badgeText)와 글자 크기를 맞춘다.
    fontSize: 11,
    color: colors.onSurfaceMuted,
  },
  // ⋮ 와 판매요청 카드의 찜 하트가 같이 쓰는 자리(둘은 같은 화면에 안 온다).
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
    color: colors.onSurface,
    // 줄 높이를 명시해야(기기·플랫폼 기본값이 제각각) 2줄 자리를 정확히 계산할 수 있다.
    lineHeight: TITLE_LINE_HEIGHT,
    // ⋮ · 찜 하트가 붙는 화면에서 제목이 그 아래로 파고들지 않게(둘은 같은 자리를 쓴다).
    // 없는 화면에서도 빈 여백일 뿐이다.
    paddingRight: 28,
    // 1줄짜리 제목도 2줄 자리를 차지해 카드 높이를 일정하게 만든다.
    minHeight: TITLE_LINE_HEIGHT * 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  // 「희망」 라벨. **크기만** 낮춘다 — 굵기·색은 안 준다.
  //
  // ⚠️ RN 의 중첩 <Text> 는 부모 스타일을 물려받는다. 그래서 여기서 fontWeight·color 를
  //    비워 두면 위 `price`(700 · 검정)를 그대로 따라간다. 웹도 같다 — 바깥 span 의
  //    `font-bold text-gray-900` 이 상속된다(`ProductHeading`).
  // ⚠️ **연하게 빼지 마라.** 「희망」은 가격을 꾸미는 말이라 가격 덩어리에 붙어야 하는데,
  //    회색으로 낮추면 시간·지역 같은 **메타 정보처럼** 보인다.
  priceLabel: {
    fontSize: 12,
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
    color: colors.onSurfaceMuted,
  },
  metaTime: {
    fontSize: 12,
    color: colors.onSurfaceSubtle,
  },
});
