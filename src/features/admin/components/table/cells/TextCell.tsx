interface TextCellProps {
  value: string | number
}

export default function TextCell({ value }: TextCellProps) {
  return <span className="text-sm text-gray-900">{String(value)}</span>
}
