'use client'

import { cn } from '@/lib/utils/cn'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl } from '@/lib/utils/imageUrl'

interface ProfileAvatarProps {
  imageUrl?: string | null
  nickname: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
}

export default function ProfileAvatar({ imageUrl, nickname, size = 'md', className }: ProfileAvatarProps) {
  return (
    <div className={cn('bg-primary-50 flex items-center justify-center overflow-hidden rounded-full', sizeClasses[size], className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toResizedWebpUrl(imageUrl, 150)}
          srcSet={getImageSrcSet(imageUrl)}
          sizes={IMAGE_SIZES.tinyThumbnail}
          alt={nickname}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget
            if (imageUrl && img.src !== imageUrl) {
              img.srcset = ''
              img.src = imageUrl
            }
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{nickname.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}
