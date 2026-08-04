import { TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
    <div className={cn(bgColor, borderColor, 'flex flex-col gap-2 rounded-lg border p-2.5')}>
      <div className="flex items-center gap-2">
        <Icon className={iconColor} size={20} />
        <p className={cn(titleColor, 'font-medium')}>{title}</p>
      </div>
      <ul className="flex flex-col gap-1">
        {/* 불릿과 글을 따로 둔다. 「• 글」을 한 덩어리로 두면 줄바꿈된 줄이 불릿 **밑**으로
            들어가 목록이 흐트러진다. 글을 flex-1로 두면 둘째 줄도 첫 줄 글자에 맞춰 선다.
            leading-none 이었는데 한 줄짜리 안내만 있을 때 이야기다 — 줄이 넘어가면 줄끼리
            붙어 읽기 어렵다. aria-hidden — 목록임은 ul·li가 이미 알린다. */}
        {alertList.map((alertItem, i) => (
          <li key={i} className={cn(listColor, 'flex gap-1.5 text-sm leading-snug')}>
            <span aria-hidden="true">•</span>
            <span className="flex-1">{alertItem}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
