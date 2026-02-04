interface FormSectionHeaderProps {
  heading?: string
  description?: string
  headingClassName?: string
}

export default function FormSectionHeader({ heading, description, headingClassName }: FormSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className={headingClassName ?? 'heading-h3'}>{heading}</h4>
      {description && <p>{description}</p>}
    </div>
  )
}
