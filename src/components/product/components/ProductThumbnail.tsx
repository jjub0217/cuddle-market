'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ProductBadge } from './ProductBadge'
import { Button } from '@/components/commons/button/Button'
import { Heart } from 'lucide-react'
import { Badge } from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

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
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const getDisplayTradeStatus = () => {
    if (productTypeName === '판매요청') {
      if (tradeStatus === '판매완료') return '요청완료'
      if (tradeStatus === null || tradeStatus === '') return '요청중'
    }
    return tradeStatus
  }
  const displayTradeStatus = getDisplayTradeStatus()

  const handleImageError = () => {
    if (!imgError && imageUrl) {
      // 첫 번째 에러: 리사이즈 이미지 실패, 원본 URL로 시도
      setImgError(true)
    } else {
      // 두 번째 에러: 원본도 실패, 플레이스홀더 사용
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !imageUrl) return PLACEHOLDER_IMAGES[800]
    if (imgError) return imageUrl
    return toResizedWebpUrl(imageUrl, 800)
  }

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
      <Image
        alt={title}
        src={getImageSrc()}
        loader={imgError || usePlaceholder || !imageUrl ? undefined : imageLoader}
        fill
        sizes={IMAGE_SIZES.productThumbnail}
        priority={priority}
        className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
        onError={handleImageError}
        unoptimized={imgError || usePlaceholder || !imageUrl}
      />
    </div>
  )
}
