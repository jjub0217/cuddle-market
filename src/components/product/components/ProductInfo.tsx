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
}

export function ProductInfo({ title, price, createdAt, favoriteCount, productTypeName }: ProductInfoProps) {
  return (
    <div className="flex h-full flex-1 flex-col justify-between gap-5 p-3 md:flex-none">
      <ProductHeading title={title} price={price} productTypeName={productTypeName} />
      <div className="flex w-full justify-between">
        <ProductMetaItem icon={Clock} label={getTimeAgo(createdAt)} className="text-gray-400" />
        <ProductMetaItem icon={Heart} label={favoriteCount} className="text-gray-400" />
      </div>
    </div>
  )
}
