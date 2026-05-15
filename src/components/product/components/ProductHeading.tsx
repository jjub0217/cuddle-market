import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductHeadingProps {
  title: string
  price: number
}

export function ProductHeading({ title, price }: ProductHeadingProps) {
  return (
    <div className="flex flex-col">
      <h3 className="line-clamp-1 text-sm text-gray-900 md:text-[13px]">{title}</h3>
      <span className="max-w-[90%] overflow-hidden font-bold text-gray-900 md:text-base">
        <span>{formatPrice(price)}</span>원
      </span>
    </div>
  )
}
