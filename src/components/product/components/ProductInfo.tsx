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
    ...(hideProductType || !productTypeName
      ? []
      : [{ label: productTypeName, tone: (productTypeName === '판매요청' ? 'warning' : 'info') as ProductBadgeItem['tone'] }]),
    ...(productStatusName ? [{ label: productStatusName, tone: 'outline' as const }] : []),
  ]

  const metaTextClass = 'text-xs font-normal md:font-medium'
  const hasFavoriteCount = typeof favoriteCount === 'number'
  const hasCreatedAt = Boolean(createdAt)

  return (
    <div className="flex flex-3 flex-col gap-2 bg-white px-2 py-1.5 md:flex-none md:p-4">
      <ProductBadge items={badgeItems} />
      <ProductHeading title={title} price={price} />
      {/* 메타 (레퍼런스 패턴): 은평구 · 찜 15  ........  3분 전 */}
      <div className="mt-auto flex w-full items-center gap-0.5 text-gray-500 md:gap-1">
        {location ? (
          <>
            <ProductMetaItem label={location} textClassName={metaTextClass} />
            {hasFavoriteCount ? (
              <span className={metaTextClass} aria-hidden="true">
                ·
              </span>
            ) : null}
          </>
        ) : null}
        {hasFavoriteCount ? <ProductMetaItem label={`찜 ${favoriteCount}`} textClassName={metaTextClass} /> : null}
        {hasCreatedAt ? (
          <ProductMetaItem label={getTimeAgo(createdAt)} className="ml-auto text-gray-500" textClassName={metaTextClass} />
        ) : null}
      </div>
    </div>
  )
}
