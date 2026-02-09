import { Clock, Heart, MapPin, Eye } from 'lucide-react'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'

interface productMetadataListProps {
  addressSido: string
  addressGugun: string
  createdAt: string
  viewCount: number
  favoriteCount: number
}

export default function ProductMetadataList({ addressSido, addressGugun, createdAt, viewCount, favoriteCount }: productMetadataListProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-5">
      <ProductMetaItem icon={MapPin} label={`${addressSido} ${addressGugun}`} />
      <ProductMetaItem icon={Clock} label={getTimeAgo(createdAt)} />
      <ProductMetaItem icon={Eye} label={`조회 ${viewCount}`} />
      <ProductMetaItem icon={Heart} label={`찜 ${favoriteCount}`} />
    </div>
  )
}
