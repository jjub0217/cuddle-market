import { formatPrice } from '@/lib/utils/formatPrice'

interface CurrencyCellProps {
  value: number
}

export default function CurrencyCell({ value }: CurrencyCellProps) {
  return <span className="text-sm font-medium text-gray-900">{formatPrice(value)}원</span>
}
