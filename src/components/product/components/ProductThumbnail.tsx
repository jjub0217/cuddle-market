'use client'

import { useState } from 'react'
import { ProductBadge } from './ProductBadge'
import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES, PLACEHOLDER_SRCSET } from '@/lib/utils/imageUrl'

interface ProductThumbnailProps {
  imageUrl: string
  title: string
  petTypeName: string
  productStatusName: string
  productTypeName: string
  tradeStatus: string | null
  productTradeColor: string
  priority?: boolean
  vertical?: boolean
}

export function ProductThumbnail({
  imageUrl,
  title,
  petTypeName,
  productStatusName,
  tradeStatus,
  productTypeName,
  productTradeColor,
  priority = false,
  vertical = false,
}: ProductThumbnailProps) {
  const [imgError, setImgError] = useState(false)

  const getDisplayTradeStatus = () => {
    if (productTypeName === '판매요청') {
      if (tradeStatus === '판매완료') return '요청완료'
      if (tradeStatus === null || tradeStatus === '') return '요청중'
    }
    return tradeStatus || ''
  }
  const displayTradeStatus = getDisplayTradeStatus()

  const getSrc = () => {
    if (!imageUrl) return PLACEHOLDER_IMAGES[800]
    if (imgError) return imageUrl
    return toResizedWebpUrl(imageUrl, 800)
  }

  const getSrcSet = () => {
    if (!imageUrl || imgError) return ''
    return getImageSrcSet(imageUrl)
  }

  return (
    <div className={cn("relative overflow-hidden", vertical ? "flex-none pb-[75%]" : "flex-[2] pb-[35%] md:flex-none md:pb-[75%]")}>
      <div className="top-sm px-sm absolute z-1">
        <ProductBadge petTypeName={petTypeName} productStatusName={productStatusName} productTypeName={productTypeName} />
      </div>
      <Badge className={cn('bottom-sm right-sm absolute z-1 text-xs text-white', productTradeColor)}>{displayTradeStatus}</Badge>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={title}
        src={getSrc()}
        srcSet={getSrcSet()}
        sizes={IMAGE_SIZES.productThumbnail}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => {
          if (!imgError && imageUrl) {
            setImgError(true)
          }
        }}
        className="t-0 l-0 absolute h-full w-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
      />
    </div>
  )
}
