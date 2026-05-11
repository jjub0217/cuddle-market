import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import Button from '@/components/commons/button/Button'
import { X } from 'lucide-react'
import Badge from '@/components/commons/badge/Badge'
import { useSortable } from '@dnd-kit/sortable'

interface SortableImageItemProps {
  url: string
  index: number
  onRemove: () => void
}

export default function SortableImageItem({ url, index, onRemove }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative size-24 overflow-hidden rounded-lg md:size-36">
      <Button
        icon={X}
        size="xs"
        className="absolute top-1 right-1 z-10 size-6 cursor-pointer rounded-full bg-gray-500 p-0.5"
        iconProps={{ color: 'white', strokeWidth: 2, size: 14 }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onRemove()
        }}
      />
      <div className="h-full w-full cursor-grab active:cursor-grabbing" {...listeners}>
        <Image src={url} alt={`preview-${index}`} fill className="object-cover" unoptimized />
      </div>
      {index === 0 ? (
        <Badge className="bg-primary-container text-on-primary-container absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-xs font-semibold">
          대표
        </Badge>
      ) : null}
    </div>
  )
}
