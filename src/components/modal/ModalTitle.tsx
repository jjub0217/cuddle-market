import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface ModalTitleProps {
  heading: string
  description: ReactNode
}

export default function ModalTitle({ heading, description }: ModalTitleProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TriangleAlert className="text-danger-600" />
        <p className="heading-h5">{heading}</p>
      </div>
      <div>{description}</div>
    </div>
  )
}
