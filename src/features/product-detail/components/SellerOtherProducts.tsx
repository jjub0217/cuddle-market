import type { Product } from '@/types'
import { Package } from 'lucide-react'
import ProductList from '@/components/product/ProductList'
import EmptyState from '@/components/EmptyState'
import { getProductType } from '@/lib/utils/getProductType'

interface SellerOtherProductsProps {
  productType: string
  sellerOtherProducts: Product[]
  sellerInfo: {
    sellerId: number
    sellerNickname: string
    sellerProfileImageUrl: string
  }
}

export default function SellerOtherProducts({ productType, sellerInfo, sellerOtherProducts }: SellerOtherProductsProps) {
  const isRequest = getProductType(productType) === '판매요청'
  const heading = isRequest
    ? `${sellerInfo?.sellerNickname}님이 찾고 있는 다른 상품`
    : `${sellerInfo?.sellerNickname}님이 판매 중인 다른 상품`
  const emptyDescription = isRequest
    ? `${sellerInfo?.sellerNickname}님이 찾고 있는 다른 상품이 아직 없습니다.`
    : `${sellerInfo?.sellerNickname}님이 판매 중인 다른 상품이 아직 없습니다.`

  return (
    <div className="pb-4xl">
      <h2 className="mb-lg text-[18px] leading-[26px] font-bold">{heading}</h2>

      {sellerOtherProducts?.length !== 0 ? (
        <ProductList
          products={sellerOtherProducts.slice(0, 3)}
          showMoreButton
          sellerId={sellerInfo.sellerId}
          hideProductType
        />
      ) : (
        <EmptyState icon={Package} title="등록된 다른 상품이 없어요" description={emptyDescription} />
      )}
    </div>
  )
}
