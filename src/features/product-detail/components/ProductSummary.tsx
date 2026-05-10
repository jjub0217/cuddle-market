'use client'

import { useState } from 'react'
import ProductMetadataList from './ProductMetadataList'
import ProductTitle from './ProductTitle'
import dynamic from 'next/dynamic'
import SellerProfileCard from './SellerProfileCard'
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
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="hidden cursor-pointer items-center gap-1 text-sm text-gray-400 hover:text-red-500 md:flex"
        >
          <span>신고하기</span>
        </button>
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
