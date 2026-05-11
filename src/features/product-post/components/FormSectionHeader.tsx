interface FormSectionHeaderProps {
  heading?: string
  description?: string
  headingClassName?: string
}

export default function FormSectionHeader({ heading, description, headingClassName }: FormSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-0">
      <h2 className={headingClassName ?? 'text-base font-semibold'}>{heading}</h2>
      {description ? <p className="text-on-surface-muted text-sm">{description}</p> : null}
    </div>
  )
}
