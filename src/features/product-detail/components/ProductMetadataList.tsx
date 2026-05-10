import { Heart, Eye } from 'lucide-react'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'

interface ProductMetadataListProps {
  addressSido: string
  addressGugun: string
  createdAt: string
  viewCount: number
  favoriteCount: number
}

export default function ProductMetadataList({
  addressSido,
  addressGugun,
  createdAt,
  viewCount,
  favoriteCount,
}: ProductMetadataListProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {/* <ProductMetaItem icon={MapPin} iconSize={14} label={`${addressSido} ${addressGugun}`} textClassName="text-xs md:text-sm font-normal" />
      <ProductMetaItem icon={Clock} iconSize={14} label={getTimeAgo(createdAt)} textClassName="text-xs md:text-sm font-normal" /> */}
      <ProductMetaItem label={getTimeAgo(createdAt)} textClassName="text-xs md:text-sm font-normal" />
      <ProductMetaItem label={`${addressSido} ${addressGugun}`} textClassName="text-xs md:text-sm font-normal" />
      <span className="hidden md:flex">
        <ProductMetaItem
          icon={Eye}
          iconSize={14}
          label={`${viewCount}`}
          textClassName="text-xs md:text-sm font-normal"
          iconClassName="text-gray-400"
        />
      </span>
      <span className="hidden md:flex">
        <ProductMetaItem
          icon={Heart}
          iconSize={14}
          label={`${favoriteCount}`}
          textClassName="text-xs md:text-sm font-normal"
          iconClassName="text-gray-400"
        />
      </span>
    </div>
  )
}
