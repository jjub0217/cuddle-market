'use client'

// ⚠️ 위 'use client' 를 지우지 마라 — 지우면 /community 가 다시 500 이 된다.
// 이 조각은 서버 조각(StaticCommunityFallback)과 클라이언트 화면(CommunityPage)이 같이 쓴다.
// 서버 조각에서 그려지면 넘기는 값이 문자로 바뀌어 브라우저로 가는데, 아래 <img> 의 onError 는
// 함수라서 못 바꾼다 → 「Event handlers cannot be passed to Client Component props」 로 500.
// 2026-05-11(#698)에 onError 가 붙으면서 깨졌고, 석 달 넘게 운영에서도 500 이었다.
// 번들 걱정은 작다: 43줄이고 유틸 둘만 쓰며, CommunityPage 는 이미 클라이언트다.

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
