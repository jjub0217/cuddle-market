import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductTitleProps {
  title: string
  productType: string
  price: number
}

export default function ProductTitle({ title, price }: ProductTitleProps) {
  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <h1 className="md:heading-h4 text-2xl leading-7 font-bold text-gray-900 md:leading-none">{title}</h1>
      <strong className="text-primary-300 heading-h3 max-w-[90%] overflow-hidden leading-none">
        <span className="leading-none">{formatPrice(price)}</span>원
      </strong>
      {/* <span className="text-base font-semibold text-gray-500">{productTypeName}</span> */}
    </div>
  )
}
