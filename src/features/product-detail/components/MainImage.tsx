'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

interface MainImageProps {
  mainImageUrl: string | null
  title: string
}

export default function MainImage({ mainImageUrl, title }: MainImageProps) {
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const handleImageError = () => {
    if (!imgError && mainImageUrl) {
      setImgError(true)
    } else {
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !mainImageUrl) return PLACEHOLDER_IMAGES[800]
    if (imgError) return mainImageUrl
    return toResizedWebpUrl(mainImageUrl, 800)
  }

  return (
    <div className="relative overflow-hidden rounded-xl pb-[100%]">
      <Image
        src={getImageSrc()}
        loader={imgError || usePlaceholder || !mainImageUrl ? undefined : imageLoader}
        sizes={IMAGE_SIZES.mainImage}
        alt={title}
        fill
        priority
        className="object-cover"
        onError={handleImageError}
        unoptimized={imgError || usePlaceholder || !mainImageUrl}
      />
    </div>
  )
}
