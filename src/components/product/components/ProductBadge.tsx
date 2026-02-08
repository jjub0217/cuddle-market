import Badge from '@/components/commons/badge/Badge'

interface ProductBadgeProps {
  petTypeName: string
  productStatusName: string
  productTypeName?: string
}

export function ProductBadge({ petTypeName, productStatusName, productTypeName }: ProductBadgeProps) {
  return (
    <div className="gap-xs z-1 flex flex-wrap">
      <Badge className="bg-primary-700 text-white">{petTypeName}</Badge>
      {productTypeName !== '판매요청' && <Badge className="bg-primary-200 text-gray-900">{productStatusName}</Badge>}
    </div>
  )
}
