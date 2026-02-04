'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'

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

export function ProfileAvatar({ imageUrl, nickname, size = 'md', className }: ProfileAvatarProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={cn('bg-primary-50 relative flex items-center justify-center overflow-hidden rounded-full', sizeClasses[size], className)}>
      {imageUrl ? (
        <Image
          src={imgError ? imageUrl : toResizedWebpUrl(imageUrl, 150)}
          loader={imgError ? undefined : imageLoader}
          alt={nickname}
          fill
          sizes={IMAGE_SIZES.tinyThumbnail}
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized={imgError}
        />
      ) : (
        <span>{nickname.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}
