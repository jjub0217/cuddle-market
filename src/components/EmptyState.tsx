import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-gray-300 bg-white px-5 py-10 md:gap-6 md:px-7 md:py-16 ${className}`}
    >
      <div className="bg-primary-50 flex h-16 w-16 items-center justify-center rounded-full md:h-25 md:w-25">
        <Icon size={32} strokeWidth={1} className="text-primary-300 md:hidden" />
        <Icon size={50} strokeWidth={1} className="text-primary-300 hidden md:block" />
      </div>
      <div className="flex flex-col items-center gap-1 md:gap-2">
        <p className="text-base font-semibold md:heading-h5">{title}</p>
        {description ? <p className="text-sm text-gray-500">{description}</p> : null}
      </div>
    </div>
  )
}
