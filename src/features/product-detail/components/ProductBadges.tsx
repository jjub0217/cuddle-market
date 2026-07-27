import { getProductStatus } from '@/lib/utils/getProductStatus'
import { getProductType } from '@/lib/utils/getProductType'
import { ProductBadge, type ProductBadgeItem } from '@/components/product/components/ProductBadge'

interface ProductBadgesProps {
  productType: string
  productStatus: string
}

export default function ProductBadges({ productType, productStatus }: ProductBadgesProps) {
  const productTypeName = getProductType(productType)
  const productStatusName = getProductStatus(productStatus)

  const items: ProductBadgeItem[] = [
    { label: productTypeName, tone: productTypeName === '판매요청' ? 'warning' : 'info' },
    // 상품상태는 카드·상세 모두 같은 회색 외곽선(앱과 동일). 예전엔 상세만 light였다.
    { label: productStatusName, tone: 'outline' },
  ]

  return <ProductBadge items={items} size="md" />
}
