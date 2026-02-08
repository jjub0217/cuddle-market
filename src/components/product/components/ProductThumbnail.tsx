import { ProductBadge } from './ProductBadge'
import Button from '@/components/commons/button/Button'
import { Heart } from 'lucide-react'
import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES, PLACEHOLDER_SRCSET } from '@/lib/utils/imageUrl'

interface ProductThumbnailProps {
  imageUrl: string
  title: string
  petTypeName: string
  productStatusName: string
  productTypeName: string
  tradeStatus: string
  productTradeColor: string
  isFavorite: boolean
  onLikeClick: (e: React.MouseEvent) => void
  priority?: boolean
}

export function ProductThumbnail({
  imageUrl,
  title,
  petTypeName,
  productStatusName,
  tradeStatus,
  productTypeName,
  productTradeColor,
  isFavorite,
  onLikeClick,
  priority = false,
}: ProductThumbnailProps) {
  const getDisplayTradeStatus = () => {
    if (productTypeName === '판매요청') {
      if (tradeStatus === '판매완료') return '요청완료'
      if (tradeStatus === null || tradeStatus === '') return '요청중'
    }
    return tradeStatus
  }
  const displayTradeStatus = getDisplayTradeStatus()

  return (
    <div className="relative flex-1 overflow-hidden pb-[35%] md:flex-none md:pb-[75%]">
      <div className="top-sm px-sm absolute flex w-full justify-between">
        <ProductBadge petTypeName={petTypeName} productStatusName={productStatusName} productTypeName={productTypeName} />
        <Button
          type="button"
          className="z-1 flex cursor-pointer items-center justify-center rounded-full bg-gray-100"
          aria-label="찜하기"
          icon={Heart}
          iconProps={{
            color: isFavorite ? '#fc8181' : undefined,
            fill: isFavorite ? '#fc8181' : 'none',
          }}
          size="xs"
          onClick={onLikeClick}
        />
      </div>
      <Badge className={cn('bottom-sm right-sm absolute z-1 text-white', productTradeColor)}>{displayTradeStatus}</Badge>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={title}
        src={imageUrl ? toResizedWebpUrl(imageUrl, 800) : PLACEHOLDER_IMAGES[800]}
        srcSet={imageUrl ? getImageSrcSet(imageUrl) : PLACEHOLDER_SRCSET}
        sizes={IMAGE_SIZES.productThumbnail}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        onError={(e) => {
          const img = e.currentTarget
          if (imageUrl && img.src !== imageUrl) {
            img.srcset = ''
            img.src = imageUrl
          } else {
            img.srcset = PLACEHOLDER_SRCSET
            img.src = PLACEHOLDER_IMAGES[800]
          }
        }}
        className="t-0 l-0 absolute h-full w-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
      />
    </div>
  )
}
