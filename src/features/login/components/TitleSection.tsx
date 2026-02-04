import Link from 'next/link'

interface TitleSectionProps {
  title: string
  desc: string
  link?: string
  linkPath?: string
}
export function TitleSection({ title, desc, link, linkPath }: TitleSectionProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="heading-h2">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="">{desc}</span>
        {link && linkPath && (
          <Link href={linkPath} className="text-primary-600">
            {link}
          </Link>
        )}
      </div>
    </div>
  )
}
