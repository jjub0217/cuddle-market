import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import Button from '@/components/commons/button/Button'
import { Plus } from 'lucide-react'
import SortableImageItem from './SortableImageItem'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface SortableImageListProps {
  previewUrls: string[]
  onDragEnd: (event: DragEndEvent) => void
  onRemoveImage: (index: number) => void
}

export default function SortableImageList({ previewUrls, onDragEnd, onRemoveImage }: SortableImageListProps) {
  const isMd = useMediaQuery('(min-width: 768px)')
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={previewUrls} strategy={horizontalListSortingStrategy}>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {previewUrls.map((imgUrl, i) => (
            <SortableImageItem key={imgUrl} url={imgUrl} index={i} onRemove={() => onRemoveImage(i)} />
          ))}
          {previewUrls.length < 5 && (
            <Button size={isMd ? 'lg' : 'sm'} className="bg-primary-300 flex cursor-pointer flex-col rounded-full text-white" icon={Plus} />
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
