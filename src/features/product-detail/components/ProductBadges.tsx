import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getCategory } from '@/lib/utils/getCategory'
import { getProductStatus } from '@/lib/utils/getProductStatus'
import { Badge } from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'

interface ProductBadgesProps {
  tradeStatus: string
  petDetailType: string
  category: string
  productStatus: string
}

export default function ProductBadges({ tradeStatus, petDetailType, category, productStatus }: ProductBadgesProps) {
  const productTradeName = getTradeStatus(tradeStatus)
  const productTradeColor = getTradeStatusColor(tradeStatus)
  const petTypeName = getPetTypeName(petDetailType)
  const categoryName = getCategory(category)
  const productStatusName = getProductStatus(productStatus)

  return (
    <div className="flex items-center gap-2 md:gap-1">
      {tradeStatus && <Badge className={cn('px-2.5 py-1.5 text-sm font-semibold text-white', productTradeColor)}>{productTradeName}</Badge>}
      <Badge className={cn('bg-primary-700 px-2.5 py-1.5 text-sm font-semibold text-white')}>{petTypeName}</Badge>
      <Badge className={cn('border bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900')}>{categoryName}</Badge>
      <Badge className={cn('bg-primary-200 px-2.5 py-1.5 text-sm font-semibold')}>{productStatusName}</Badge>
    </div>
  )
}
