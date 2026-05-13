import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductHeadingProps {
  title: string
  price: number
}

export function ProductHeading({ title, price }: ProductHeadingProps) {
  return (
    <div className="flex flex-col">
      <h3 className="line-clamp-1 text-[13px] text-gray-900">{title}</h3>
      <span className="text-md max-w-[90%] overflow-hidden font-bold text-gray-900">
        <span>{formatPrice(price)}</span>원
      </span>
    </div>
  )
}
