import Link from 'next/link'

interface TitleSectionProps {
  title: string
  desc?: string
  link?: string
  linkPath?: string
}

export function TitleSection({ title, desc, link, linkPath }: TitleSectionProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <h1 className="heading-h4">{title}</h1>
      {desc ? <span className="text-sm">{desc}</span> : null}
      {link && linkPath ? (
        <Link href={linkPath} className="text-primary-300 text-sm font-bold">
          {link}
        </Link>
      ) : null}
    </div>
  )
}
