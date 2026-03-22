import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { ProductHeading } from './ProductHeading'
import { Clock, Heart } from 'lucide-react'
import { ProductMetaItem } from '../ProductMetaItem'

interface ProductInfoProps {
  title: string
  price: number
  createdAt: string
  favoriteCount: number
  productTypeName: string
  isFavorite: boolean
  onLikeClick: (e: React.MouseEvent) => void
}

export function ProductInfo({ title, price, createdAt, favoriteCount, productTypeName, isFavorite, onLikeClick }: ProductInfoProps) {
  return (
    <div className="flex flex-[3] flex-col justify-between gap-5 bg-white p-3 md:flex-none">
      <ProductHeading title={title} price={price} productTypeName={productTypeName} />
      <div className="flex w-full justify-between">
        <ProductMetaItem icon={Clock} label={getTimeAgo(createdAt)} iconSize={13} className="text-gray-400" textClassName="text-[13px] md:text-sm font-normal" />
        <button type="button" className="pointer-events-auto flex cursor-pointer items-center gap-1 text-gray-400" onClick={onLikeClick} aria-label="찜하기">
          <Heart size={13} color={isFavorite ? '#fc8181' : 'currentColor'} fill={isFavorite ? '#fc8181' : 'none'} aria-hidden="true" />
          <span className="text-[13px] md:text-sm font-normal">{favoriteCount}</span>
        </button>
      </div>
    </div>
  )
}
