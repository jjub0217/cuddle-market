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
    { label: productStatusName, tone: 'light' },
  ]

  return <ProductBadge items={items} size="md" />
}
