'use client'

import { useState } from 'react'
import { Eye, Heart, Flag } from 'lucide-react'
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
          <ProductMetaItem icon={Eye} iconSize={14} label={`조회 ${viewCount}`} textClassName="text-xs font-normal" />
          <ProductMetaItem icon={Heart} iconSize={14} label={`찜 ${favoriteCount}`} textClassName="text-xs font-normal" />
        </div>
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-red-500"
        >
          <Flag size={14} />
          <span>신고하기</span>
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
