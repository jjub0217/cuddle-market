import { TriangleAlert, type LucideIcon } from 'lucide-react'

interface AlertBoxProps {
  alertList: string[]
  icon?: LucideIcon
  iconColor?: string
  bgColor?: string
  borderColor?: string
  title?: string
  titleColor?: string
  listColor?: string
}

export default function AlertBox({
  alertList,
  icon: Icon = TriangleAlert,
  iconColor = 'text-danger-800',
  bgColor = 'bg-danger-100/30',
  borderColor = 'border-danger-100',
  title = '주의사항',
  titleColor = 'text-danger-800',
  listColor = 'text-danger-600',
}: AlertBoxProps) {
  return (
    <div className={`${bgColor} ${borderColor} flex flex-col gap-2 rounded-lg border p-2.5`}>
      <div className="flex items-center gap-2">
        <Icon className={iconColor} size={20} />
        <p className={`${titleColor} font-medium`}>{title}</p>
      </div>
      <ul className="flex flex-col gap-1">
        {alertList.map((alertIem, i) => (
          <li key={i} className={`${listColor} text-sm leading-none`}>
            • {alertIem}
          </li>
        ))}
      </ul>
    </div>
  )
}
