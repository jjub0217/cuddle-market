'use client'

import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES, PLACEHOLDER_SRCSET } from '@/lib/utils/imageUrl'
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
  return (
    <>
      <div className={`relative aspect-square shrink-0 overflow-hidden rounded-lg ${sizeClasses[size]}`}>
        <img
          src={productImageUrl ? toResizedWebpUrl(productImageUrl, 150) : PLACEHOLDER_IMAGES[150]}
          srcSet={productImageUrl ? getImageSrcSet(productImageUrl) : PLACEHOLDER_SRCSET}
          sizes={IMAGE_SIZES.tinyThumbnail}
          loading="lazy"
          alt={productTitle}
          onError={(e) => {
            const img = e.currentTarget
            if (productImageUrl && img.src !== productImageUrl) {
              img.srcset = ''
              img.src = productImageUrl
            } else {
              img.srcset = PLACEHOLDER_SRCSET
              img.src = PLACEHOLDER_IMAGES[150]
            }
          }}
          className="h-full w-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate">{productTitle}</p>
        <p className="font-bold">{formatPrice(Number(productPrice))}원</p>
      </div>
    </>
  )
}
