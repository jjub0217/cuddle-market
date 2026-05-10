import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { ProductHeading } from './ProductHeading'
import { ProductBadge, type ProductBadgeItem } from './ProductBadge'
import { ProductMetaItem } from '../ProductMetaItem'

interface ProductInfoProps {
  title: string
  price: number
  createdAt: string
  favoriteCount: number
  productTypeName: string
  productStatusName: string
  isFavorite: boolean
  hideProductType?: boolean
  location?: string
}

export function ProductInfo({
  title,
  price,
  createdAt,
  favoriteCount,
  productTypeName,
  productStatusName,
  hideProductType = false,
  location,
}: ProductInfoProps) {
  const badgeItems: ProductBadgeItem[] = [
    ...(hideProductType
      ? []
      : [{ label: productTypeName, tone: (productTypeName === '판매요청' ? 'warning' : 'info') as ProductBadgeItem['tone'] }]),
    { label: productStatusName, tone: 'outline' },
  ]

  const metaTextClass = 'text-xs font-medium'

  return (
    <div className="flex flex-3 flex-col gap-2 bg-white p-3 md:flex-none md:p-4">
      <ProductBadge items={badgeItems} />
      <ProductHeading title={title} price={price} />
      {/* 메타 (레퍼런스 패턴): 은평구 · 좋아요 15  ........  3분 전 */}
      <div className="mt-auto flex w-full items-center gap-1 text-gray-500">
        {location ? (
          <>
            <ProductMetaItem label={location} textClassName={metaTextClass} />
            <span className={metaTextClass} aria-hidden="true">·</span>
          </>
        ) : null}
        <ProductMetaItem label={`좋아요 ${favoriteCount}`} textClassName={metaTextClass} />
        <ProductMetaItem label={getTimeAgo(createdAt)} className="ml-auto text-gray-500" textClassName={metaTextClass} />
      </div>
    </div>
  )
}
