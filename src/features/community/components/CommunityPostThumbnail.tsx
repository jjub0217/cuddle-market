import { cn } from '@/lib/utils/cn'
import { IMAGE_SIZES, PLACEHOLDER_IMAGES, getImageSrcSet, toResizedWebpUrl } from '@/lib/utils/imageUrl'

interface CommunityPostThumbnailProps {
  imageUrl?: string | null
  title: string
  className?: string
}

export function CommunityPostThumbnail({ imageUrl, title, className }: CommunityPostThumbnailProps) {
  if (!imageUrl) return null

  return (
    <div className={cn('relative size-24 shrink-0 overflow-hidden rounded-2xl bg-[#f4efe7] md:size-36', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={toResizedWebpUrl(imageUrl, 150)}
        srcSet={getImageSrcSet(imageUrl)}
        sizes={IMAGE_SIZES.smallThumbnail}
        alt={title}
        loading="lazy"
        data-origin-src={imageUrl}
        data-placeholder-src={PLACEHOLDER_IMAGES[150]}
        onError={(e) => {
          const img = e.currentTarget
          const originSrc = img.dataset.originSrc
          const placeholderSrc = img.dataset.placeholderSrc

          if (originSrc && img.src !== originSrc) {
            img.srcset = ''
            img.src = originSrc
            return
          }

          if (placeholderSrc && img.src !== placeholderSrc) {
            img.src = placeholderSrc
          }
        }}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
