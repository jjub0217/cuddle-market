interface TitleSectionProps {
  title: string
}

export function TitleSection({ title }: TitleSectionProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <h1 className="heading-h4">{title}</h1>
      <span className="text-sm">계정에 로그인하여 더 많은 기능을 이용해보세요</span>
    </div>
  )
}
