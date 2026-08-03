'use client'

import { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import ProductMetadataList from './ProductMetadataList'
import ProductTitle from './ProductTitle'
import dynamic from 'next/dynamic'
import SellerProfileCard from './SellerProfileCard'
import ProductOwnerActions from './ProductOwnerActions'
const ProductReportModal = dynamic(() => import('@/components/modal/ProductReportModal'))

interface ProductHeaderProps {
  data: {
    id: number
    title: string
    productType: string
    price: number
    addressSido: string
    addressGugun: string
    createdAt: string
    mainImageUrl: string
    viewCount: number
    favoriteCount: number
    sellerInfo: {
      sellerId: number
      sellerNickname: string
      sellerProfileImageUrl: string
      addressSido: string | null
      addressGugun: string | null
    }
  }
}

export default function ProductSummary({ data }: ProductHeaderProps) {
  const [isReportOpen, setIsReportOpen] = useState(false)
  const { user } = useUserStore()
  // 내 상품에는 신고를 안 보인다. 판매자를 모르면 역시 안 보인다 —
  // 내 상품을 남의 것으로 오인해 신고 창을 여는 것보다 낫다(앱의 isSellerKnown과 같다).
  const canReport = data.sellerInfo?.sellerId !== undefined && user?.id !== data.sellerInfo.sellerId

  return (
    <div className="flex flex-col gap-2">
      <ProductTitle title={data.title} productType={data.productType} price={data.price} />
      <div className="flex items-center justify-between">
        <ProductMetadataList
          addressSido={data.addressSido}
          addressGugun={data.addressGugun}
          createdAt={data.createdAt}
          viewCount={data.viewCount}
          favoriteCount={data.favoriteCount}
        />
        {/* 이 자리는 「이 상품에 대해 내가 할 관리 행동」이다. 상대에 따라 내용만 바뀐다.
            남의 상품 → 신고하기 · 내 상품 → 수정 · 삭제
            자주 하는 일이 아니라 글자 단추로 조용히 둔다. */}
        {canReport ? (
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="hidden cursor-pointer items-center gap-1 text-sm text-gray-400 hover:text-red-500 md:flex"
          >
            <span>신고하기</span>
          </button>
        ) : (
          <div className="hidden md:block">
            <ProductOwnerActions productId={data.id} title={data.title} price={data.price} mainImageUrl={data.mainImageUrl} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <SellerProfileCard sellerInfo={data.sellerInfo} />
      </div>

      <ProductReportModal
        isOpen={isReportOpen}
        productId={data.id}
        productTitle={data.title}
        onCancel={() => setIsReportOpen(false)}
      />
    </div>
  )
}
