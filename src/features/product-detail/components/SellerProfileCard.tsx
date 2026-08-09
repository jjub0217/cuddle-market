'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { ROUTES } from '@/constants/routes'

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
    // ⚠️ **내 프로필이면 마이페이지로 보낸다.** /user-profile 은 남의 프로필을 보는 자리다 —
    //    내 id 로 들어가면 요약 카운트도, 사이드바도, 내 글·내 댓글도 없는 반쪽 화면이 뜬다.
    //    「내 프로필」은 마이페이지가 맡는다(#869).
    router.push(sellerId === user?.id ? ROUTES.MYPAGE : `/user-profile/${sellerId}`)
  }

  // ⚠️ **내 상품이어도 그린다.** 전에는 내 것이면 카드를 통째로 안 그렸는데,
  //    그러면 길에 따라 동작이 갈렸다 — 홈 상품 목록에서는 내 상품의 프로필도 그냥 눌렸다.
  //    「내가 올린 상품이 남에게 어떻게 보이는지」를 확인할 수도 없었다.
  //    누르면 마이페이지로 간다(위 goToUserPage) — 내 프로필은 거기가 맡는다(#869).
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
