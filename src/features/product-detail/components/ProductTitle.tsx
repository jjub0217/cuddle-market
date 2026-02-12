import { getProductType } from '@/lib/utils/getProductType'
import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductTitleProps {
  title: string
  productType: string
  price: number
}

export default function ProductTitle({ title, productType, price }: ProductTitleProps) {
  const productTypeName = getProductType(productType)
  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="heading-h2_5 text-gray-900">{title}</h1>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-gray-500">{productTypeName}</span>
        <strong className="text-primary-300 heading-h3 max-w-[90%] overflow-hidden">
          <span>{formatPrice(price)}</span>원
        </strong>
      </div>
    </div>
  )
}
