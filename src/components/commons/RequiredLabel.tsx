import { cn } from '@/lib/utils/cn'

interface RequiredLabelProps {
  htmlFor?: string
  children: string
  labelClass?: string
  required?: boolean
}

export default function RequiredLabel({ htmlFor, children, labelClass, required = true }: RequiredLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn('text-gray-900', labelClass)}>
      <span>{children}</span>
      {required && <span className="text-danger-500">*</span>}
    </label>
  )
}
