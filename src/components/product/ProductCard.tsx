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

  const handleContentClick = () => {
    if (window.getSelection()?.toString()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    router.push(ROUTES.DETAIL_ID(id, title))
  }

  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-all duration-500 md:rounded-3xl md:hover:-translate-y-1 md:hover:shadow-xl"
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
          createdAt={createdAt}
          favoriteCount={favoriteCount}
          productTypeName={productTypeName}
          productStatusName={productStatusName}
          isFavorite={isFavorite}
          hideProductType={hideProductType}
          location={location}
        />
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
      </div>
    </article>
  )
}

export default ProductCard
