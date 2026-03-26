import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface SimpleHeaderProps {
  title: string
  description?: string
  href?: string
  layoutClassname?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function SimpleHeader({ title, description, href, layoutClassname, titleClassName, descriptionClassName }: SimpleHeaderProps) {
  return (
    <div className={cn('mx-auto flex max-w-7xl flex-col gap-2 bg-white px-3.5 py-2.5', layoutClassname)}>
      {href ? (
        <Link href={href} className={cn(titleClassName || 'heading-h2', 'hover:text-primary-200 w-fit cursor-pointer transition-all')}>
          {title}
        </Link>
      ) : (
        <span className={titleClassName || 'heading-h2'}>{title}</span>
      )}
      {description ? <p className={descriptionClassName}>{description}</p> : null}
    </div>
  )
}
