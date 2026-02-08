import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: string
  className?: string
}

export default function Badge({ children, className }: BadgeProps) {
  return <span className={cn('flex items-center justify-center rounded-md px-2 py-1 text-sm', className)}>{children}</span>
}
