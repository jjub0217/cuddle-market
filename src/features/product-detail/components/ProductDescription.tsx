interface ProductDescriptionProps {
  description: string
}
export default function ProductDescription({ description }: ProductDescriptionProps) {
  return (
    <div className="h-64 overflow-y-auto rounded-lg border border-gray-300 p-3.5 whitespace-pre-line text-gray-900 md:min-h-[22vh]">
      {description}
    </div>
  )
}
