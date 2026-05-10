import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null
  return (
    <nav aria-label="카테고리 경로" className={cn('text-sm', className)}>
      <ol className="flex items-center gap-1.5 text-gray-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          const linkBase = 'transition-colors hover:underline'
          const lastStyle = 'font-bold text-[#633f00]'
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(linkBase, isLast ? lastStyle : 'hover:text-[#633f00]')}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? lastStyle : ''}>{item.label}</span>
                )}
              </li>
              {!isLast ? (
                <li aria-hidden="true" className="flex items-center text-gray-400">
                  <ChevronRight size={14} strokeWidth={2} />
                </li>
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
