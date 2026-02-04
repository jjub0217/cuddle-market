import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-gray-300 bg-[#F9FAFB] px-7 py-16 ${className}`}
    >
      <div className="bg-primary-50 flex h-[100px] w-[100px] items-center justify-center rounded-full">
        <Icon size={50} strokeWidth={1} className="text-primary-300" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="heading-h4">{title}</p>
        {description && <p className="text-gray-500">{description}</p>}
      </div>
    </div>
  )
}
