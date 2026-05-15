interface ProductDescriptionProps {
  description: string
}
export default function ProductDescription({ description }: ProductDescriptionProps) {
  return (
    <section
      aria-label="상품 설명"
      className="min-h-20 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3.5 text-sm whitespace-pre-line text-gray-900 md:min-h-[22vh]"
    >
      {description}
    </section>
  )
}
