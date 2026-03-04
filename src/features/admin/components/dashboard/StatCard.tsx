import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  className?: string
}

export default function StatCard({ title, value, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-lg bg-gray-100 p-3">
          <Icon size={24} className="text-gray-600" />
        </div>
      </div>
    </div>
  )
}
