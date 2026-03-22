import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getCategory } from '@/lib/utils/getCategory'
import { getProductStatus } from '@/lib/utils/getProductStatus'
import { getProductType } from '@/lib/utils/getProductType'
import Badge from '@/components/commons/badge/Badge'
import { cn } from '@/lib/utils/cn'

interface ProductBadgesProps {
  tradeStatus: string | null
  petDetailType: string
  category: string
  productStatus: string
  productType: string
}

export default function ProductBadges({ tradeStatus, petDetailType, category, productStatus, productType }: ProductBadgesProps) {
  const productTypeName = getProductType(productType)
  const productTradeName = getTradeStatus(tradeStatus)
  const productTradeColor = getTradeStatusColor(tradeStatus)
  const petTypeName = getPetTypeName(petDetailType)
  const categoryName = getCategory(category)
  const productStatusName = getProductStatus(productStatus)

  const getDisplayTradeStatus = () => {
    if (productTypeName === '판매요청') {
      if (productTradeName === '판매완료') return '요청완료'
      if (tradeStatus === null || tradeStatus === '') return '요청중'
    }
    return productTradeName || ''
  }
  const displayTradeStatus = getDisplayTradeStatus()

  return (
    <div className="flex flex-col gap-2">
      {displayTradeStatus ? <Badge className={cn('w-fit px-[15px] py-[10px] text-base font-semibold leading-none text-white', productTradeColor)}>{displayTradeStatus}</Badge> : null}
      <div className="flex items-center gap-2 md:gap-1">
        <Badge className={cn('bg-primary-700 px-2 py-1.5 text-[13px] font-semibold leading-none text-white')}>{petTypeName}</Badge>
        <Badge className={cn('border bg-white px-2 py-1.5 text-[13px] font-semibold leading-none text-gray-900')}>{categoryName}</Badge>
        <Badge className={cn('bg-primary-200 px-2 py-1.5 text-[13px] font-semibold leading-none')}>{productStatusName}</Badge>
      </div>
    </div>
  )
}
