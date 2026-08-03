'use client'

import { useState } from 'react'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'
import { useUserStore } from '@/store/userStore'
import ProductOwnerActions from './ProductOwnerActions'
import dynamic from 'next/dynamic'
const ProductReportModal = dynamic(() => import('@/components/modal/ProductReportModal'))

interface ProductDetailMobileMetaProps {
  productId: number
  productTitle: string
  viewCount: number
  favoriteCount: number
  /** 내 상품인지 가리려고 받는다. 내 것을 신고할 이유가 없다 */
  sellerId?: number
  /** 삭제 확인 창이 상품을 보여주는 데 쓴다 */
  price: number
  mainImageUrl: string
}

export default function ProductDetailMobileMeta({
  productId,
  productTitle,
  viewCount,
  favoriteCount,
  sellerId,
  price,
  mainImageUrl,
}: ProductDetailMobileMetaProps) {
  const [isReportOpen, setIsReportOpen] = useState(false)
  const { user } = useUserStore()
  // 판매자를 모르면(sellerId가 없으면) 신고를 안 보인다 — 내 상품을 남의 것으로
  // 오인해 신고 창을 여는 것보다 낫다. 앱도 같은 판단이다(isSellerKnown).
  const canReport = sellerId !== undefined && user?.id !== sellerId

  return (
    <>
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          {/* 조회·찜은 누를 수 없는 정보라 아이콘 없이 글자로만 둔다 */}
          <ProductMetaItem label={`조회 ${viewCount}`} textClassName="text-xs font-normal" />
          <ProductMetaItem label={`찜 ${favoriteCount}`} textClassName="text-xs font-normal" />
        </div>
        {/* 남의 상품이면 신고하기, 내 상품이면 수정·삭제. 같은 자리에 같은 성격의 것을 둔다 */}
        {canReport ? (
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="cursor-pointer text-xs text-gray-400 hover:text-red-500"
          >
            신고하기
          </button>
        ) : sellerId !== undefined ? (
          <ProductOwnerActions productId={productId} title={productTitle} price={price} mainImageUrl={mainImageUrl} />
        ) : null}
      </div>
      <ProductReportModal
        isOpen={isReportOpen}
        productId={productId}
        productTitle={productTitle}
        onCancel={() => setIsReportOpen(false)}
      />
    </>
  )
}
