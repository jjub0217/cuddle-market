'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'

interface SellerAvatarProps {
  profileImageUrl?: string | null
  nickname?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

export function SellerAvatar({ profileImageUrl, nickname, size = 'md' }: SellerAvatarProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={`bg-primary-50 relative flex items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]}`}>
      {profileImageUrl ? (
        <Image
          src={imgError ? profileImageUrl : toResizedWebpUrl(profileImageUrl, 150)}
          loader={imgError ? undefined : imageLoader}
          alt={nickname || '판매자 프로필'}
          fill
          sizes={IMAGE_SIZES.tinyThumbnail}
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized={imgError}
        />
      ) : (
        <p>{nickname?.charAt(0).toUpperCase()}</p>
      )}
    </div>
  )
}
