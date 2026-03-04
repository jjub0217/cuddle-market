import { formatDate } from '@/lib/utils/formatDate'

interface DateCellProps {
  value: string
}

export default function DateCell({ value }: DateCellProps) {
  return <span className="text-sm text-gray-600">{formatDate(value)}</span>
}
