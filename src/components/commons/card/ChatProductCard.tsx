'use client'

import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES, PLACEHOLDER_SRCSET } from '@/lib/utils/imageUrl'
import { formatPrice } from '@/lib/utils/formatPrice'
import { cn } from '@/lib/utils/cn'
import { getTradeLabel } from '@cuddle/shared'

interface ChatProductCardProps {
  productImageUrl?: string
  productTitle?: string
  productPrice?: number
  size?: 'sm' | 'md'
  /** 거래 상태. 주면 썸네일 위에 뱃지를 얹는다. 없으면 아무것도 안 그린다 */
  tradeStatus?: string | null
  /**
   * SELL(판매) 또는 REQUEST(판매요청). `getTradeLabel`이 COMPLETED일 때 「판매완료」·「요청완료」를
   * 가르는 데 쓴다. 안 주면 판매(SELL)로 친다 — `getTradeLabel`도 REQUEST가 아니면 판매로
   * 취급해서 지금까지의 「늘 판매완료」 동작과 같다.
   */
  productType?: string
}

const sizeClasses = {
  sm: 'w-10',
  md: 'w-16',
}

const priceClasses = {
  sm: 'text-sm font-bold',
  md: 'font-bold',
}

// 마이페이지 판매내역(MyList.tsx:132~168)의 오버레이·알약 모양을 그대로 따른다 — 새로 짓지 않는다.
// 다만 셋은 일부러 다르게 한다:
//  1) 라벨 문구는 공용 함수 `getTradeLabel`(원본 packages/shared)이 정한다 — 판매(SELL)
//     상품은 COMPLETED일 때 「판매완료」, 판매요청(REQUEST) 상품은 「요청완료」다. MyList 는
//     탭(판매/구매)으로 갈라 문구를 고르지만, 채팅방에는 그 탭 개념이 없어 productType 으로
//     가른다. 앱(mobile/lib/tradeStatus.ts 의 `getOverlay`)도 같은 함수로 라벨을 받는다.
//  2) 사진을 흐리게(opacity·grayscale) 하지 않는다 — MyList 썸네일은 96~128px 이지만
//     이 카드는 64px(md)이다. 그 크기에서 흐리기까지 더하면 무슨 상품인지 못 알아본다.
//  3) 알약 크기를 줄인다 — MyList 의 `px-4 py-1.5 text-xs` 를 그대로 쓰면 64px 상자보다
//     알약이 커진다. 모양(흰 알약·둥근 모서리·굵은 글씨·그림자)은 지키고 글자 크기·여백만 줄였다.
//
// ⚠️ **이 값은 64px(`size="md"`) 기준이다.** 진짜 크롬으로 재서 「판매완료」가 47x19 로
//    들어가는 것을 확인했다(2026-08-23). `size="sm"`(40px) 은 지금 뱃지를 안 쓴다 —
//    채팅방 **목록**(ChatRooms.tsx)이 `tradeStatus` 를 안 넘기기 때문이다.
//    나중에 목록에도 붙이게 되면 **그때 40px 로 다시 재서** 크기를 정할 것.
//    미리 만들어 두지 않는다 — 안 쓰는 값은 재보지도 못한 채 남는다.
const BADGE_CLASSNAME = 'px-1.5 py-0.5 text-[10px]'

// ⚠️ **RESERVED 도 `getTradeLabel` 에 맡긴다.** 지금은 `productType` 과 무관하게 늘 「예약중」이라
//    직접 적어도 같지만, 라벨을 공용 함수에 맡겨 두면 **나중에 판매요청 쪽 문구가 갈려도
//    여기가 저절로 따라온다.** 문구를 두 곳에서 정하지 않는 것이 이 고침의 요점이다(#1038).
//
// 뱃지를 그릴지 말지는 이 조각이 정한다(앱의 getOverlay 도 같은 구조) — `getTradeLabel` 은
// SELLING 에도 「판매중」을 돌려주지만, 그 경우는 뱃지를 안 그린다. 「무슨 글자냐」는 라벨
// 함수에, 「그릴지 말지」는 여기에 남긴다.
function getOverlay(tradeStatus?: string | null, productType?: string) {
  if (tradeStatus === 'COMPLETED') return { label: getTradeLabel(tradeStatus, productType ?? 'SELL'), bg: 'bg-black/60' }
  if (tradeStatus === 'RESERVED') return { label: getTradeLabel(tradeStatus, productType ?? 'SELL'), bg: 'bg-black/40' }
  return null
}

export default function ChatProductCard({
  productImageUrl,
  productTitle,
  productPrice,
  size = 'sm',
  tradeStatus,
  productType,
}: ChatProductCardProps) {
  const overlay = getOverlay(tradeStatus, productType)

  return (
    <>
      <div className={`relative aspect-square shrink-0 overflow-hidden rounded-lg ${sizeClasses[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 백엔드 Lambda+CloudFront에서 이미 WebP 리사이즈 처리됨 */}
        <img
          src={productImageUrl ? toResizedWebpUrl(productImageUrl, 150) : PLACEHOLDER_IMAGES[150]}
          srcSet={productImageUrl ? getImageSrcSet(productImageUrl) : PLACEHOLDER_SRCSET}
          sizes={IMAGE_SIZES.tinyThumbnail}
          loading="lazy"
          alt={productTitle ?? '상품 이미지'}
          onError={(e) => {
            const img = e.currentTarget
            if (productImageUrl && img.src !== productImageUrl) {
              img.srcset = ''
              img.src = productImageUrl
            } else {
              img.srcset = PLACEHOLDER_SRCSET
              img.src = PLACEHOLDER_IMAGES[150]
            }
          }}
          className="h-full w-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
        />
        {overlay ? (
          <div className={cn('absolute inset-0 z-10 flex items-center justify-center', overlay.bg)}>
            <span
              className={cn('rounded-full bg-white/95 font-bold whitespace-nowrap text-gray-900 shadow-md', BADGE_CLASSNAME)}
            >
              {overlay.label}
            </span>
          </div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium md:font-bold`}>{productTitle}</p>
        <p className={`${priceClasses[size]} text-[#684d21]`}>{productPrice != null ? `${formatPrice(productPrice)}원` : ''}</p>
      </div>
    </>
  )
}
