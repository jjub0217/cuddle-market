'use client'

import { useCallback, useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import Button from '@/components/commons/button/Button'

interface ProductThumbnailProps {
  imageUrl: string
  title: string
  productTypeName: string
  tradeStatus: string | null
  priority?: boolean
  vertical?: boolean
  isFavorite: boolean
  onLikeClick: (e: React.MouseEvent) => void
}

export function ProductThumbnail({
  imageUrl,
  title,
  productTypeName,
  tradeStatus,
  priority = false,
  vertical = false,
  isFavorite,
  onLikeClick,
}: ProductThumbnailProps) {
  const [imgErrorStep, setImgErrorStep] = useState(0)

  const handleImageRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0 && imgErrorStep < 2) {
        setImgErrorStep((prev) => prev + 1)
      }
    },
    [imgErrorStep]
  )

  const getDisplayTradeStatus = () => {
    if (productTypeName === '판매요청') {
      if (tradeStatus === '판매완료') return '요청완료'
      if (!tradeStatus) return '요청중'
    }
    return tradeStatus || ''
  }
  const displayTradeStatus = getDisplayTradeStatus()
  const isOverlayShown = tradeStatus === '예약중' || tradeStatus === '판매완료' || displayTradeStatus === '요청완료'
  const overlayBg = tradeStatus === '예약중' ? 'bg-black/40' : 'bg-black/60'

  const getSrc = () => {
    if (!imageUrl || imgErrorStep >= 2) return PLACEHOLDER_IMAGES[800]
    if (imgErrorStep === 1) return imageUrl
    return toResizedWebpUrl(imageUrl, 800)
  }

  const getSrcSet = () => {
    if (!imageUrl || imgErrorStep > 0) return ''
    return getImageSrcSet(imageUrl)
  }

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onLikeClick(e)
  }

  return (
    <div
      className={cn(
        'bg-chip-surface relative overflow-hidden',
        vertical ? 'flex-none pb-[75%]' : 'flex-2 pb-[35%] md:flex-none md:pb-[75%]'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={handleImageRef}
        alt={title}
        src={getSrc()}
        srcSet={getSrcSet()}
        sizes={IMAGE_SIZES.productThumbnail}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => {
          if (imgErrorStep < 2) setImgErrorStep((prev) => prev + 1)
        }}
        className="absolute top-0 left-0 h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-110"
      />

      {/* 거래상태 중앙 큰 오버레이 (모바일/데스크탑 동일) */}
      {isOverlayShown ? (
        <div className={cn('absolute inset-0 z-10 flex items-center justify-center', overlayBg)}>
          <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-gray-900 shadow-md">
            {displayTradeStatus}
          </span>
        </div>
      ) : null}

      {/* 찜 토글 버튼 (이미지 우상단 오버레이) */}
      <Button
        type="button"
        size="sm"
        icon={Heart}
        iconProps={{
          size: 20,
          strokeWidth: 2,
          className: cn(
            'drop-shadow-md',
            isFavorite ? 'fill-[#fc8181] stroke-[#fc8181]' : 'fill-none stroke-white'
          ),
          'aria-hidden': true,
        }}
        onClick={handleHeartClick}
        aria-label={isFavorite ? '찜 해제' : '찜하기'}
        className="pointer-events-auto absolute top-0.5 right-0.5 z-20 h-8 w-8 cursor-pointer bg-transparent p-0 md:h-7 md:w-7"
      />
    </div>
  )
}
