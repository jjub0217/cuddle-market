import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface ModalTitleProps {
  heading: string
  description: ReactNode
  headingId?: string
}

export default function ModalTitle({ heading, description, headingId }: ModalTitleProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TriangleAlert className="text-danger-600" />
        <p id={headingId} className="heading-h5">
          {heading}
        </p>
      </div>
      <div className="break-keep wrap-break-word">{description}</div>
    </div>
  )
}
