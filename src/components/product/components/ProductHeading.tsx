import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductHeadingProps {
  title: string
  price: number
  productTypeName: string
  hideProductType?: boolean
}

export function ProductHeading({ title, price, productTypeName, hideProductType = false }: ProductHeadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="line-clamp line-1 text-sm font-normal md:text-base md:font-medium text-gray-900">{title}</span>
      <p className="flex w-full flex-col">
        <span className="text-primary-300 max-w-[90%] overflow-hidden font-bold">
          <span>{formatPrice(price)}</span>원
        </span>
        {productTypeName && !hideProductType ? <span className="text-[13px] md:text-sm font-normal md:font-semibold text-gray-500">{productTypeName}</span> : null}
      </p>
    </div>
  )
}
