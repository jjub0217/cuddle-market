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
      {/* 조회·찜은 누를 수 없는 정보라 아이콘 없이 글자로만 둔다 */}
      <span className="hidden md:flex">
        <ProductMetaItem label={`조회 ${viewCount}`} textClassName="text-xs md:text-sm font-normal" />
      </span>
      <span className="hidden md:flex">
        <ProductMetaItem label={`찜 ${favoriteCount}`} textClassName="text-xs md:text-sm font-normal" />
      </span>
    </div>
  )
}
