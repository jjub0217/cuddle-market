interface FormSectionHeaderProps {
  heading?: string
  description?: string
  headingClassName?: string
}

export default function FormSectionHeader({ heading, description, headingClassName }: FormSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-0">
      {/* 기본 크기는 폼 안의 다른 이름표와 같다(ProductNameField의 labelClassName).
          한 화면에서 「상품 사진」만 폰에서 크게 보이던 것을 맞춘 값이다. */}
      <h2 className={headingClassName ?? 'text-sm font-semibold md:text-base'}>{heading}</h2>
      {description ? <p className="text-on-surface-muted text-sm">{description}</p> : null}
    </div>
  )
}
