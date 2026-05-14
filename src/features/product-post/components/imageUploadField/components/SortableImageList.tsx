import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Camera } from 'lucide-react'
import SortableImageItem from './SortableImageItem'

interface SortableImageListProps {
  previewUrls: string[]
  onDragEnd: (event: DragEndEvent) => void
  onRemoveImage: (index: number) => void
}

export default function SortableImageList({ previewUrls, onDragEnd, onRemoveImage }: SortableImageListProps) {
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={previewUrls} strategy={horizontalListSortingStrategy}>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {previewUrls.map((imgUrl, i) => (
            <SortableImageItem key={imgUrl} url={imgUrl} index={i} onRemove={() => onRemoveImage(i)} />
          ))}
          {previewUrls.length < 5 ? (
            <div
              role="button"
              tabIndex={0}
              className="border-outline-variant hover:border-primary-container hover:bg-surface-container-low bg-surface-container-lowest flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-gray-500 transition-colors md:size-36"
            >
              <Camera className="size-6 md:size-8" strokeWidth={1.5} />
              <span className="text-xs font-semibold md:text-sm">이미지 등록</span>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </DndContext>
  )
}
