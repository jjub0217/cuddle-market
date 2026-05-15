import Logo from '@/components/Logo'
import Link from 'next/link'

interface TitleSectionProps {
  title: string
  desc?: string
  link?: string
  linkPath?: string
  size?: 'sm' | 'md'
}

export function TitleSection({ title, desc, link, linkPath, size = 'md' }: TitleSectionProps) {
  const titleClass = size === 'sm' ? 'heading-h4' : 'heading-h3'
  const descClass = 'text-sm text-on-surface-muted'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <h1 className={titleClass}>{title}</h1>
        {desc ? <span className={descClass}>{desc}</span> : null}
        {link && linkPath ? (
          <Link href={linkPath} className="text-primary-300 text-sm font-bold">
            {link}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
