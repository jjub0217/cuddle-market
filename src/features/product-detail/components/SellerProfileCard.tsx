'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'

interface SellerProfileCardProps {
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
    addressSido: string | null
    addressGugun: string | null
  }
}

export default function SellerProfileCard({ sellerInfo }: SellerProfileCardProps) {
  const { isLogin, setRedirectUrl } = useUserStore()
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

  // ⚠️ **내 상품이어도 그린다.** 전에는 내 것이면 카드를 통째로 안 그렸는데(`!== user?.id`),
  //    그러면 길에 따라 동작이 갈렸다 — 홈 상품 목록에서는 내 상품의 프로필도 그냥 눌렸다.
  //    게다가 프로필 화면(ProfileData)은 isMyProfile 로 아홉 곳을 갈라 **내 프로필로 들어오는
  //    것을 정식으로 다루고 있다**(요약 카운트·「프로필 수정」 링크는 내 것일 때만 보인다).
  //    아무도 못 들어오는 화면에 그런 걸 만들 리 없다 — 막아 둔 이쪽이 어긋난 것이었다(#869).
  return (
    <div className="flex cursor-pointer items-center justify-between" onClick={() => goToUserPage(sellerInfo.sellerId)}>
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
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-medium text-gray-900">{sellerInfo?.sellerNickname}</h2>
          {sellerInfo.addressSido || sellerInfo.addressGugun ? (
            <span className="text-xs leading-none text-gray-500">
              {[sellerInfo.addressSido, sellerInfo.addressGugun].filter(Boolean).join(' ')}
            </span>
          ) : null}
        </div>
      </div>
      {/* <Button
          size="sm"
          className="h-fit cursor-pointer border border-gray-200 bg-white text-xs md:text-sm text-gray-900"
          onClick={() => goToUserPage(sellerInfo.sellerId)}
        >
          판매자 프로필 보기
        </Button> */}
    </div>
  )
}
