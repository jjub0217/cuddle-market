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
  const router = useRouter()
  const handleContentClick = (e: React.MouseEvent) => {
    if (window.getSelection()?.toString()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    router.push(ROUTES.DETAIL_ID(id, title))
  }

  return (
    <article
      className="border-border text-text-primary relative overflow-hidden rounded-xl border bg-white shadow-md transition-shadow duration-200 hover:shadow-xl"
      data-index={dataIndex}
    >
      <Link
        href={ROUTES.DETAIL_ID(id, title)}
        className="absolute inset-0 z-0"
        aria-label={`${title}, ${price}원, ${productStatusName}, ${petTypeName}, ${productTradeName}`}
      />
      <div className="relative z-1 flex cursor-pointer flex-row-reverse md:flex-col-reverse" onClick={handleContentClick}>
        <ProductInfo title={title} price={price} createdAt={createdAt} favoriteCount={favoriteCount} productTypeName={productTypeName} isFavorite={isFavorite} onLikeClick={handleToggleFavorite} />
        <ProductThumbnail
          imageUrl={mainImageUrl}
          title={title}
          petTypeName={petTypeName}
          productTypeName={productTypeName}
          productStatusName={productStatusName}
          tradeStatus={productTradeName}
          productTradeColor={productTradeColor}
          priority={dataIndex !== undefined && dataIndex < 4}
        />
      </div>
    </article>
  )
}

export default ProductCard
