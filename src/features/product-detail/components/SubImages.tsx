'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'

interface SubImagesProps {
  mainImageUrl: string
  subImageUrls: string[]
  title: string
}

function SubImageItem({ image, title, idx }: { image: string; title: string; idx: number }) {
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const handleImageError = () => {
    if (!imgError && image) {
      setImgError(true)
    } else {
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !image) return PLACEHOLDER_IMAGES[400]
    if (imgError) return image
    return toResizedWebpUrl(image, 400)
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-white pb-[100%]">
      <Image
        src={getImageSrc()}
        loader={imgError || usePlaceholder || !image ? undefined : imageLoader}
        sizes={IMAGE_SIZES.subImages}
        alt={`${title} - ${idx + 1}`}
        fill
        className="object-cover object-top"
        onError={handleImageError}
        unoptimized={imgError || usePlaceholder || !image}
      />
    </div>
  )
}

export default function SubImages({ mainImageUrl, subImageUrls, title }: SubImagesProps) {
  return (
    mainImageUrl &&
    subImageUrls.length > 0 && (
      <div className="grid grid-cols-4 gap-2">
        {subImageUrls.map((image, idx) => (
          <SubImageItem key={idx} image={image} title={title} idx={idx} />
        ))}
      </div>
    )
  )
}
