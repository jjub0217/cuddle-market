'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Product } from '@/types/product'
import { ProductThumbnail } from './components/ProductThumbnail'
import { ProductInfo } from './components/ProductInfo'
import { ROUTES } from '@/constants/routes'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getProductStatus } from '@/lib/utils/getProductStatus'
import { getProductType } from '@/lib/utils/getProductType'
import { getTradeLabel } from '@cuddle/shared'
import { useFavorite } from '@/hooks/useFavorite'
import { cn } from '@/lib/utils/cn'

export interface ProductCardProps {
  data: Product
  'data-index'?: number
  /**
   * 카드를 모든 viewport에서 세로 레이아웃으로 강제합니다.
   *
   * - `false` (기본): 모바일(<768px)에서 가로 카드, 데스크탑(≥768px)에서 세로 카드 (responsive)
   * - `true`: 모바일에서도 세로 강제 — 모바일 2-column grid처럼 좁은 영역에 카드를 넣을 때 사용 (예: `UserPage`)
   *
   * 데스크탑에서는 두 값 모두 세로라 시각 차이가 없습니다. 차이는 모바일에서만 발생합니다.
   */
  vertical?: boolean
  /**
   * 카드의 "판매 / 판매요청" 뱃지를 숨깁니다. `vertical` 과 독립적으로 동작합니다.
   */
  hideProductType?: boolean
}

function ProductCard({ data, 'data-index': dataIndex, vertical = false, hideProductType }: ProductCardProps) {
  const router = useRouter()
  const { isFavorite, handleToggleFavorite } = useFavorite({
    productId: data?.id,
    initialIsFavorite: data?.isFavorite ?? false,
  })

  if (!data) return null

  const {
    id,
    title,
    price,
    mainImageUrl,
    petDetailType,
    productStatus,
    tradeStatus,
    createdAt,
    favoriteCount,
    productType,
    addressSido,
    addressGugun,
  } = data
  const location = addressGugun || addressSido || ''
  const petTypeName = getPetTypeName(petDetailType)
  const productStatusName = getProductStatus(productStatus)
  const productTradeName = getTradeStatus(tradeStatus)
  const productTypeName = getProductType(productType)
  // 판매요청(「구해요」) 글의 사진은 **내가 파는 물건이 아니다** — 남의 물건을 퍼온 예시다.
  // 판매글 사진과 뜻이 다른데 같은 자리에 들어가서, 요청 카드는 썸네일 자리를 아예 안 그린다.
  // 사진이 없을 때 회색 네모를 그리면 「사진이 있어야 하는데 없다 = 깨졌다」로 읽힌다(#1109).
  //
  // 한글 이름(`productTypeName`)이 아니라 **원본 코드**로 가른다. 이름은 코드로 만들어 낸
  // 파생값이고(constants.ts 의 PRODUCT_TYPE_TABS), 모르는 코드가 오면 코드를 그대로 돌려준다.
  // 문구가 바뀌면 이름 비교는 조용히 깨진다 — 코드가 원본이다.
  const isRequest = productType === 'REQUEST'

  // 썸네일을 안 그리면 **거기 얹혀 있던 것 둘이 같이 사라진다** — 찜 하트와 거래상태 오버레이다.
  // 둘 다 `ProductThumbnail` 안에 있고, 이 카드는 그 둘을 **다른 데서는 안 보여준다**
  // (`ProductInfo` 의 뱃지 줄은 판매유형·상품상태뿐이다). 그래서 요청 카드만 글자 영역으로 옮긴다.
  //
  // 거래상태: 「무슨 글자냐」는 공용 함수 `getTradeLabel`(원본 packages/shared)이 정하고,
  // 「그릴지 말지」는 여기가 정한다 — 판매중·요청중이면 안 그린다. 채팅방 상품 카드
  // (ChatProductCard.tsx 의 `getOverlay`)·앱(mobile/lib/tradeStatus.ts)과 같은 구조다.
  // ⚠️ 웹의 `getTradeStatus`(= `productTradeName`)는 요청 글을 몰라서 COMPLETED 를 늘
  //    「판매완료」로 준다. 요청 글에 맞는 「요청완료」를 얻으려면 `getTradeLabel` 을 써야 한다.
  const requestTradeName =
    isRequest && (tradeStatus === 'RESERVED' || tradeStatus === 'COMPLETED')
      ? getTradeLabel(tradeStatus, productType)
      : null

  const handleContentClick = () => {
    if (window.getSelection()?.toString()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    router.push(ROUTES.DETAIL_ID(id, title))
  }

  // ⚠️ 아래 `h-full` 은 **판매요청 카드 때문에 있다**(#1109). 요청 카드는 썸네일을 안 그려서
  //    판매 카드보다 214px 짧다. 그리드(`ProductList`)의 `<li>` 는 `align-items: stretch` 라
  //    이미 행 높이만큼 늘어나 있는데, 카드가 자기 높이만 차지해서 **테두리가 들쭉날쭉해
  //    보였다.** `h-full` 로 카드가 그 자리를 채우면 테두리 줄이 가지런해진다.
  //    (안쪽 글자는 위에 붙고 아래가 비는데, 겉보기에는 그편이 훨씬 낫다.)
  //
  // ⚠️ 그리드가 아닌 곳에서는 부모가 높이를 안 정하므로 `auto` 와 같아 아무 일도 안 한다.
  return (
    <article
      className="group relative h-full overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-all duration-500 md:rounded-3xl md:hover:-translate-y-1 md:hover:shadow-xl"
      data-index={dataIndex}
    >
      <Link
        href={ROUTES.DETAIL_ID(id, title)}
        className="absolute inset-0 z-0"
        aria-label={`${title}, ${price}원, ${productStatusName}, ${petTypeName}, ${productTradeName}`}
      />
      <div
        className={cn('relative z-1 flex cursor-pointer', vertical ? 'flex-col-reverse' : 'flex-row-reverse md:flex-col-reverse')}
        onClick={handleContentClick}
      >
        <ProductInfo
          title={title}
          price={price}
          productType={productType}
          createdAt={createdAt}
          favoriteCount={favoriteCount}
          productTypeName={productTypeName}
          productStatusName={productStatusName}
          isFavorite={isFavorite}
          hideProductType={hideProductType}
          location={location}
          tradeStatusName={requestTradeName}
          onLikeClick={isRequest ? handleToggleFavorite : undefined}
        />
        {isRequest ? null : (
          <ProductThumbnail
            imageUrl={mainImageUrl}
            title={title}
            productTypeName={productTypeName}
            tradeStatus={productTradeName}
            priority={dataIndex !== undefined && dataIndex < 4}
            vertical={vertical}
            isFavorite={isFavorite}
            onLikeClick={handleToggleFavorite}
          />
        )}
      </div>
    </article>
  )
}

export default ProductCard
