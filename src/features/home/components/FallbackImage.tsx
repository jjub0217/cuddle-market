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
  const [imgError, setImgError] = useState(false)

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={getSrc()}
      srcSet={getSrcSet()}
      sizes={sizes}
      fetchPriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => {
        if (!imgError && imageUrl) {
          setImgError(true)
        }
      }}
      className={className}
    />
  )
}
