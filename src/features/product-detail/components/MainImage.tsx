'use client'

import { useCallback, useState } from 'react'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

interface MainImageProps {
  mainImageUrl: string | null
  title: string
}

export default function MainImage({ mainImageUrl, title }: MainImageProps) {
  const [imgErrorStep, setImgErrorStep] = useState(0) // 0: CDN, 1: 원본, 2: placeholder

  const getSrc = () => {
    if (!mainImageUrl || imgErrorStep >= 2) return PLACEHOLDER_IMAGES[800]
    if (imgErrorStep === 1) return mainImageUrl
    return toResizedWebpUrl(mainImageUrl, 800)
  }

  const getSrcSet = () => {
    if (!mainImageUrl || imgErrorStep > 0) return ''
    return getImageSrcSet(mainImageUrl)
  }

  return (
    <div className="relative overflow-hidden rounded-xl pb-[100%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={useCallback((img: HTMLImageElement | null) => {
          if (img && img.complete && img.naturalWidth === 0 && imgErrorStep < 2) {
            setImgErrorStep((prev) => prev + 1)
          }
        }, [imgErrorStep])}
        src={getSrc()}
        srcSet={getSrcSet()}
        sizes={IMAGE_SIZES.mainImage}
        alt={title}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => {
          if (imgErrorStep < 2) {
            setImgErrorStep((prev) => prev + 1)
          }
        }}
      />
    </div>
  )
}
