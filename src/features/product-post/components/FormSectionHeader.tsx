interface FormSectionHeaderProps {
  heading?: string
  description?: string
  headingClassName?: string
}

export default function FormSectionHeader({ heading, description, headingClassName }: FormSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-0">
      <h2 className={headingClassName ?? 'text-base md:text-[20px] font-bold'}>{heading}</h2>
      {description ? <p className="text-sm">{description}</p> : null}
    </div>
  )
}
