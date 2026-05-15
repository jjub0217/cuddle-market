'use client'

import { useState } from 'react'
import { Eye, Heart } from 'lucide-react'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'
import dynamic from 'next/dynamic'
const ProductReportModal = dynamic(() => import('@/components/modal/ProductReportModal'))

interface ProductDetailMobileMetaProps {
  productId: number
  productTitle: string
  viewCount: number
  favoriteCount: number
}

export default function ProductDetailMobileMeta({ productId, productTitle, viewCount, favoriteCount }: ProductDetailMobileMetaProps) {
  const [isReportOpen, setIsReportOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <ProductMetaItem
            icon={Eye}
            iconSize={14}
            label={`조회 ${viewCount}`}
            textClassName="text-xs font-normal"
            iconClassName="text-gray-400"
          />
          <ProductMetaItem
            icon={Heart}
            iconSize={14}
            label={`찜 ${favoriteCount}`}
            textClassName="text-xs font-normal"
            iconClassName="text-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="cursor-pointer text-xs text-gray-400 hover:text-red-500"
        >
          신고하기
        </button>
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
