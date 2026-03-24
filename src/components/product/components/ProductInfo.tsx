import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { ProductHeading } from './ProductHeading'
import { Clock, Heart, Eye } from 'lucide-react'
import { ProductMetaItem } from '../ProductMetaItem'

interface ProductInfoProps {
  title: string
  price: number
  createdAt: string
  favoriteCount: number
  viewCount?: number
  productTypeName: string
  isFavorite: boolean
  onLikeClick: (e: React.MouseEvent) => void
  hideProductType?: boolean
}

export function ProductInfo({ title, price, createdAt, favoriteCount, viewCount, productTypeName, isFavorite, onLikeClick, hideProductType = false }: ProductInfoProps) {
  return (
    <div className="flex flex-[3] flex-col justify-between gap-5 bg-white p-3 md:flex-none">
      <ProductHeading title={title} price={price} productTypeName={productTypeName} hideProductType={hideProductType} />
      <div className="flex w-full items-center justify-between">
        <ProductMetaItem icon={Clock} label={getTimeAgo(createdAt)} iconSize={13} className="text-gray-400" textClassName="text-[13px] md:text-sm font-normal" />
        <div className="flex items-center gap-2">
          {viewCount !== undefined ? (
            <span className="flex items-center gap-1 text-gray-400">
              <Eye size={13} aria-hidden="true" />
              <span className="text-[13px] md:text-sm font-normal">{viewCount}</span>
            </span>
          ) : null}
          <button type="button" className="pointer-events-auto flex cursor-pointer items-center gap-1 text-gray-400" onClick={onLikeClick} aria-label="찜하기">
            <Heart size={13} color={isFavorite ? '#fc8181' : 'currentColor'} fill={isFavorite ? '#fc8181' : 'none'} aria-hidden="true" />
            <span className="text-[13px] md:text-sm font-normal">{favoriteCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
