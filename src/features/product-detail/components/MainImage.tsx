'use client'

import { useCallback, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import { cn } from '@/lib/utils/cn'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const SWIPER_WHITE_THEME: React.CSSProperties = {
  // Pagination 흰색 기반 (Navigation은 커스텀 Lucide 아이콘으로 대체)
  ['--swiper-pagination-color' as string]: '#ffffff',
  ['--swiper-pagination-bullet-inactive-color' as string]: '#ffffff',
  ['--swiper-pagination-bullet-inactive-opacity' as string]: '0.5',
}

interface MainImageProps {
  mainImageUrl: string | null
  subImageUrls: string[]
  title: string
  tradeStatus: string | null
  productTypeName: string
}

interface SlideProps {
  imageUrl: string
  title: string
  index: number
}

function Slide({ imageUrl, title, index }: SlideProps) {
  const [imgErrorStep, setImgErrorStep] = useState(0) // 0: CDN, 1: 원본, 2: placeholder

  const getSrc = () => {
    if (!imageUrl || imgErrorStep >= 2) return PLACEHOLDER_IMAGES[800]
    if (imgErrorStep === 1) return imageUrl
    return toResizedWebpUrl(imageUrl, 800)
  }

  const getSrcSet = () => {
    if (!imageUrl || imgErrorStep > 0) return ''
    return getImageSrcSet(imageUrl)
  }

  const handleImgRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0 && imgErrorStep < 2) {
        setImgErrorStep((prev) => prev + 1)
      }
    },
    [imgErrorStep]
  )

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={handleImgRef}
      src={getSrc()}
      srcSet={getSrcSet()}
      sizes={IMAGE_SIZES.mainImage}
      alt={`${title} - ${index + 1}`}
      fetchPriority={index === 0 ? 'high' : 'auto'}
      loading={index === 0 ? 'eager' : 'lazy'}
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => {
        if (imgErrorStep < 2) {
          setImgErrorStep((prev) => prev + 1)
        }
      }}
    />
  )
}

export default function MainImage({ mainImageUrl, subImageUrls, title, tradeStatus, productTypeName }: MainImageProps) {
  // 대표 + 서브 이미지를 단일 array로 결합 (첫 항목 = 기존 mainImage)
  const images = [mainImageUrl, ...subImageUrls].filter((url): url is string => Boolean(url))
  const slides = images.length > 0 ? images : [PLACEHOLDER_IMAGES[800]]
  const hasMultiple = slides.length > 1

  /**
   * 이전/다음 버튼을 Swiper에 넘기는 방법.
   *
   * 예전에는 `useRef` + 그리는 도중에 `prevRef.current`를 읽어 `navigation`에 넣었다.
   * 렌더는 순수해야 해서 ref를 읽으면 안 된다(react-hooks/refs). 게다가 첫 렌더에는
   * 아직 버튼이 안 붙어 있어 늘 null이었고, 그래서 `onBeforeInit`으로 한 번 더 넣어
   * 주는 우회가 붙어 있었다.
   *
   * ref 대신 **state에 담는다.** `ref={setPrevEl}`처럼 함수를 주면 React가 버튼을
   * 붙일 때 그 요소로, 뗄 때 null로 불러 준다(콜백 ref). 값이 바뀌면 다시 그려지고
   * Swiper가 새 요소를 받는다. 그리는 도중에 읽는 곳이 없어진다.
   */
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null)
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null)

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
  const isLargerBadge = tradeStatus === '판매완료' || displayTradeStatus === '요청완료'
  const badgeSizeClass = isLargerBadge ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'

  return (
    <div className="relative overflow-hidden rounded-xl pb-[100%]">
      <div className="absolute inset-0">
        <Swiper
          modules={[Pagination, Navigation]}
          pagination={{ clickable: true }}
          navigation={{ prevEl, nextEl }}
          slidesPerView={1}
          spaceBetween={0}
          loop={hasMultiple}
          className="swiper-detail-image h-full w-full"
          style={SWIPER_WHITE_THEME}
        >
          {slides.map((imageUrl, index) => (
            <SwiperSlide key={`${imageUrl}-${index}`} className="relative">
              <Slide imageUrl={imageUrl} title={title} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 커스텀 navigation 버튼 — Lucide 아이콘 */}
      {hasMultiple ? (
        <>
          <button
            ref={setPrevEl}
            type="button"
            aria-label="이전 이미지"
            className="absolute top-1/2 left-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-80"
          >
            <ChevronLeft size={44} strokeWidth={1.5} />
          </button>
          <button
            ref={setNextEl}
            type="button"
            aria-label="다음 이미지"
            className="absolute top-1/2 right-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-80"
          >
            <ChevronRight size={44} strokeWidth={1.5} />
          </button>
        </>
      ) : null}

      {/* 거래상태 중앙 큰 오버레이 (메인 카드 ProductThumbnail과 동일 패턴) */}
      {isOverlayShown ? (
        <div className={cn('pointer-events-none absolute inset-0 z-10 flex items-center justify-center', overlayBg)}>
          <span className={cn('rounded-full bg-white/95 font-bold text-gray-900 shadow-md', badgeSizeClass)}>
            {displayTradeStatus}
          </span>
        </div>
      ) : null}
    </div>
  )
}
