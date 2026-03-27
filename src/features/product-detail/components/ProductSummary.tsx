'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import ProductMetadataList from './ProductMetadataList'
import ProductTitle from './ProductTitle'
import dynamic from 'next/dynamic'
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
  }
}

export default function ProductSummary({ data }: ProductHeaderProps) {
  const [isReportOpen, setIsReportOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3.5">
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
          <Flag size={14} />
          <span>신고하기</span>
        </button>
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
