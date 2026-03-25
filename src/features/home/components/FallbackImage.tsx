'use client'

import { useState } from 'react'
import { getImageSrcSet, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

interface FallbackImageProps {
  imageUrl: string | null
  alt: string
  sizes: string
  priority: boolean
  className: string
}

export function FallbackImage({ imageUrl, alt, sizes, priority, className }: FallbackImageProps) {
  const [imgErrorStep, setImgErrorStep] = useState(0) // 0: CDN, 1: 원본, 2: placeholder

  const getSrc = () => {
    if (!imageUrl || imgErrorStep >= 2) return PLACEHOLDER_IMAGES[800]
    if (imgErrorStep === 1) return imageUrl
    return toResizedWebpUrl(imageUrl, 800)
  }

  const getSrcSet = () => {
    if (!imageUrl || imgErrorStep > 0) return ''
    return getImageSrcSet(imageUrl)
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={getSrc()}
      srcSet={getSrcSet()}
      sizes={sizes}
      fetchPriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => {
        if (imgErrorStep < 2) {
          setImgErrorStep((prev) => prev + 1)
        }
      }}
      className={className}
    />
  )
}
