'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { Button } from '@/components/commons/button/Button'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'

interface SellerProfileCardProps {
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
  }
}

export default function SellerProfileCard({ sellerInfo }: SellerProfileCardProps) {
  const { user, isLogin, setRedirectUrl } = useUserStore()
  const { openLoginModal } = useLoginModalStore()
  const router = useRouter()
  const [imgError, setImgError] = useState(false)

  const goToUserPage = (sellerId: number) => {
    if (!isLogin()) {
      setRedirectUrl(window.location.pathname)
      openLoginModal()
      return
    }
    router.push(`/user-profile/${sellerId}`)
  }

  return (
    sellerInfo?.sellerId !== user?.id && (
      <div className="flex justify-between rounded-lg border border-gray-300 p-5">
        <div className="flex items-center gap-2">
          <div className="bg-primary-50 relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            {sellerInfo.sellerProfileImageUrl ? (
              <Image
                src={imgError ? sellerInfo.sellerProfileImageUrl : toResizedWebpUrl(sellerInfo.sellerProfileImageUrl, 150)}
                loader={imgError ? undefined : imageLoader}
                sizes={IMAGE_SIZES.tinyThumbnail}
                alt={sellerInfo?.sellerNickname}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
                unoptimized={imgError}
              />
            ) : (
              <div className="heading-h5 font-normal!">{sellerInfo?.sellerNickname.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <h3 className="text-gray-900">{sellerInfo?.sellerNickname}</h3>
        </div>
        <Button
          size="sm"
          className="h-fit cursor-pointer border border-gray-300 bg-white text-sm text-gray-900"
          onClick={() => goToUserPage(sellerInfo.sellerId)}
        >
          판매자 프로필 보기
        </Button>
      </div>
    )
  )
}
