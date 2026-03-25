'use client'

import { useState } from 'react'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

interface MainImageProps {
  mainImageUrl: string | null
  title: string
}

export default function MainImage({ mainImageUrl, title }: MainImageProps) {
  const [imgError, setImgError] = useState(false)

  const getSrc = () => {
    if (!mainImageUrl) return PLACEHOLDER_IMAGES[800]
    if (imgError) return mainImageUrl
    return toResizedWebpUrl(mainImageUrl, 800)
  }

  const getSrcSet = () => {
    if (!mainImageUrl || imgError) return ''
    return getImageSrcSet(mainImageUrl)
  }

  return (
    <div className="relative overflow-hidden rounded-xl pb-[100%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getSrc()}
        srcSet={getSrcSet()}
        sizes={IMAGE_SIZES.mainImage}
        alt={title}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => {
          if (!imgError && mainImageUrl) {
            setImgError(true)
          }
        }}
      />
    </div>
  )
}
