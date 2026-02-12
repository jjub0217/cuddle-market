import type { Product } from '@/types'
import { Package } from 'lucide-react'
import ProductList from '@/components/product/ProductList'
import EmptyState from '@/components/EmptyState'

interface SellerOtherProductsProps {
  sellerOtherProducts: Product[]
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
  }
}

export default function SellerOtherProducts({ sellerInfo, sellerOtherProducts }: SellerOtherProductsProps) {
  return (
    <div className="pb-4xl">
      <h2 className="heading-h4 text-text-primary mb-lg">{sellerInfo?.sellerNickname}님의 다른 판매 상품</h2>

      {sellerOtherProducts?.length !== 0 ? (
        <ProductList products={sellerOtherProducts.slice(0, 3)} showMoreButton sellerId={sellerInfo.sellerId} />
      ) : (
        <EmptyState
          icon={Package}
          title="등록된 다른 상품이 없어요"
          description={`${sellerInfo?.sellerNickname}님이 판매 중인 다른 상품이 아직 없습니다.`}
        />
      )}
    </div>
  )
}
