'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import { formatPrice } from '@/lib/utils/formatPrice'

interface ChatProductCardProps {
  productImageUrl?: string
  productTitle?: string
  productPrice?: number
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: 'w-10',
  md: 'w-16',
}

export function ChatProductCard({ productImageUrl, productTitle, productPrice, size = 'sm' }: ChatProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const handleImageError = () => {
    if (!imgError && productImageUrl) {
      setImgError(true)
    } else {
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !productImageUrl) return PLACEHOLDER_IMAGES[150]
    if (imgError) return productImageUrl
    return toResizedWebpUrl(productImageUrl, 150)
  }

  return (
    <>
      <div className={`relative aspect-square shrink-0 overflow-hidden rounded-lg ${sizeClasses[size]}`}>
        <Image
          src={getImageSrc()}
          loader={imgError || usePlaceholder || !productImageUrl ? undefined : imageLoader}
          sizes={IMAGE_SIZES.tinyThumbnail}
          alt={productTitle || '상품 이미지'}
          fill
          className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
          onError={handleImageError}
          unoptimized={imgError || usePlaceholder || !productImageUrl}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate">{productTitle}</p>
        <p className="font-bold">{formatPrice(Number(productPrice))}원</p>
      </div>
    </>
  )
}
