'use client'

import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES, PLACEHOLDER_SRCSET } from '@/lib/utils/imageUrl'

interface MainImageProps {
  mainImageUrl: string | null
  title: string
}

export default function MainImage({ mainImageUrl, title }: MainImageProps) {
  return (
    <div className="relative overflow-hidden rounded-xl pb-[100%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mainImageUrl ? toResizedWebpUrl(mainImageUrl, 800) : PLACEHOLDER_IMAGES[800]}
        srcSet={mainImageUrl ? getImageSrcSet(mainImageUrl) : PLACEHOLDER_SRCSET}
        sizes={IMAGE_SIZES.mainImage}
        alt={title}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          const img = e.currentTarget
          if (mainImageUrl && img.src !== mainImageUrl) {
            img.srcset = ''
            img.src = mainImageUrl
          } else {
            img.srcset = PLACEHOLDER_SRCSET
            img.src = PLACEHOLDER_IMAGES[800]
          }
        }}
      />
    </div>
  )
}
