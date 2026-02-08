'use client'

import Link from 'next/link'
import type { Product } from '@/types/product'
import { ProductThumbnail } from './components/ProductThumbnail'
import { ProductInfo } from './components/ProductInfo'
import { ROUTES } from '@/constants/routes'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getProductStatus } from '@/lib/utils/getProductStatus'
import { getProductType } from '@/lib/utils/getProductType'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { useFavorite } from '@/hooks/useFavorite'

export interface ProductCardProps {
  data: Product
  'data-index'?: number
}

function ProductCard({ data, 'data-index': dataIndex }: ProductCardProps) {
  const { isFavorite, handleToggleFavorite } = useFavorite({
    productId: data?.id,
    initialIsFavorite: data?.isFavorite ?? false,
  })

  if (!data) return null

  const { id, title, price, mainImageUrl, petDetailType, productStatus, tradeStatus, createdAt, favoriteCount, productType } = data
  const petTypeName = getPetTypeName(petDetailType)
  const productStatusName = getProductStatus(productStatus)
  const productTradeName = getTradeStatus(tradeStatus)
  const productTypeName = getProductType(productType)
  const productTradeColor = getTradeStatusColor(tradeStatus)
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Link
      className="border-border text-text-primary flex cursor-pointer flex-row-reverse overflow-hidden rounded-xl border bg-white shadow-md transition-shadow duration-200 hover:shadow-xl md:flex-col-reverse"
      onClick={handleCardClick}
      data-index={dataIndex}
      aria-label={`${title}, ${price}원, ${productStatusName}, ${petTypeName}, ${productTradeName}`}
      href={ROUTES.DETAIL_ID(id)}
    >
      <ProductInfo title={title} price={price} createdAt={createdAt} favoriteCount={favoriteCount} productTypeName={productTypeName} />
      <ProductThumbnail
        imageUrl={mainImageUrl}
        title={title}
        petTypeName={petTypeName}
        productTypeName={productTypeName}
        productStatusName={productStatusName}
        tradeStatus={productTradeName}
        productTradeColor={productTradeColor}
        isFavorite={isFavorite}
        onLikeClick={handleToggleFavorite}
        priority={dataIndex !== undefined && dataIndex < 4}
      />
    </Link>
  )
}

export default ProductCard
