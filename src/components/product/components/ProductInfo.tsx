import { getTimeAgo } from '@cuddle/shared'
import { Heart } from 'lucide-react'
import { ProductHeading } from './ProductHeading'
import { ProductBadge, type ProductBadgeItem } from './ProductBadge'
import { ProductMetaItem } from '../ProductMetaItem'
import Button from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'

interface ProductInfoProps {
  title: string
  price: number
  /**
   * 상품 갈래 코드(`SELL`·`REQUEST`). 판매요청이면 가격 앞에 「희망」이 붙는다(#1113).
   *
   * ⚠️ 옆의 `productTypeName` 과 다르다. 그쪽은 뱃지에 그릴 **한글 이름**이고 이것은
   *    **원본 코드**다. 가르는 일에는 코드를 쓴다 — 문구가 바뀌어도 안 깨진다.
   */
  productType?: string | null
  createdAt: string
  favoriteCount: number
  productTypeName: string
  productStatusName: string
  isFavorite: boolean
  hideProductType?: boolean
  location?: string
  /**
   * 거래상태 글자(「예약중」·「요청완료」 등). 주면 뱃지 줄에 먹색 알약으로 들어간다.
   *
   * 판매 카드는 이 값을 **썸네일 위 오버레이**로 보여주므로 안 넘긴다. 썸네일이 없는
   * 판매요청 카드만 넘긴다(#1109) — 안 그러면 「전체」로 볼 때 끝난 요청과 도는 요청이
   * 똑같아 보인다. 「그릴지 말지」는 넘기는 쪽이 정한다(SELLING·요청중이면 안 넘긴다).
   */
  tradeStatusName?: string | null
  /**
   * 주면 글자 영역 오른쪽 위에 찜 하트가 붙는다.
   *
   * 찜 하트는 원래 썸네일 안에 있어서, 썸네일을 안 그리는 판매요청 카드에서는 같이
   * 사라진다. 그런데 판매요청도 찜할 수 있고 **찜한 상품 목록에 그대로 실려서, 하트가
   * 없으면 뺄 방법이 없어진다.** 그래서 요청 카드만 이 자리로 옮긴다(#1109).
   */
  onLikeClick?: (e: React.MouseEvent) => void
}

export function ProductInfo({
  title,
  price,
  productType,
  createdAt,
  favoriteCount,
  productTypeName,
  productStatusName,
  isFavorite,
  hideProductType = false,
  location,
  tradeStatusName,
  onLikeClick,
}: ProductInfoProps) {
  // 뱃지 차례: 판매유형 · 거래상태 · 상품상태. 앱 카드와 같은 차례다
  // (mobile/components/product-card.tsx 의 `badgeRow`).
  const badgeItems: ProductBadgeItem[] = [
    ...(hideProductType || !productTypeName
      ? []
      : [{ label: productTypeName, tone: (productTypeName === '판매요청' ? 'warning' : 'info') as ProductBadgeItem['tone'] }]),
    ...(tradeStatusName ? [{ label: tradeStatusName, tone: 'solid' as const }] : []),
    ...(productStatusName ? [{ label: productStatusName, tone: 'outline' as const }] : []),
  ]

  const handleHeartClick = (e: React.MouseEvent) => {
    // 카드 전체가 누를 수 있는 자리라(겹쳐 둔 <Link> + onClick) 하트가 상세로 넘어가지 않게 막는다.
    // 썸네일 안 하트와 같은 처리다(ProductThumbnail.tsx).
    e.stopPropagation()
    e.preventDefault()
    onLikeClick?.(e)
  }

  const metaTextClass = 'text-xs font-normal md:font-medium'
  const hasFavoriteCount = typeof favoriteCount === 'number'
  const hasCreatedAt = Boolean(createdAt)

  return (
    <div className="relative flex flex-3 flex-col gap-2 bg-white px-2 py-1.5 md:flex-none md:p-4 md:pl-3">
      {onLikeClick ? (
        <Button
          type="button"
          size="sm"
          icon={Heart}
          iconProps={{
            size: 20,
            strokeWidth: 2,
            // 사진 위가 아니라 **흰 바탕**이라 그림자(drop-shadow)를 안 깐다.
            // 안 찜한 상태도 흰색이 아니라 회색이다 — 흰 바탕에서 흰 하트는 안 보인다.
            className: cn(isFavorite ? 'fill-[#fc8181] stroke-[#fc8181]' : 'fill-none stroke-gray-400'),
            'aria-hidden': true,
          }}
          onClick={handleHeartClick}
          aria-label={isFavorite ? '찜 해제' : '찜하기'}
          // ⚠️ `z-2` 다. 뱃지 줄도 `z-1` 이고 DOM 에서 **뒤에 있어서**, 같은 z 면 뱃지 줄이 위에 깔린다.
          //    그러면 뱃지 줄의 `pr-7`(하트 자리를 비우려고 준 여백) 이 하트를 덮어 **누름이 안 먹는다.**
          //    2026-08-31 에 진짜 크롬으로 확인했다 — 플레이라이트가 「div ... intercepts pointer events」로 막혔다.
          className="pointer-events-auto absolute top-0.5 right-1 z-2 h-7 w-7 cursor-pointer bg-transparent p-0 md:top-2.5 md:right-2.5"
        />
      ) : null}
      {/* 하트가 붙으면 뱃지 줄이 그 아래로 파고들지 않게 오른쪽을 비운다.
          하트는 절대 배치라 자리를 안 차지하고, 뱃지 줄이 이 카드에서 가장 위 칸이라 부딪힌다. */}
      <ProductBadge items={badgeItems} className={onLikeClick ? 'pr-7' : undefined} />
      <ProductHeading title={title} price={price} productType={productType} />
      {/* 메타 (레퍼런스 패턴): 은평구 · 찜 15  ........  3분 전 */}
      <div className="mt-auto flex w-full items-center gap-0.5 text-gray-500 md:gap-1">
        {location ? (
          <>
            <ProductMetaItem label={location} textClassName={metaTextClass} />
            {hasFavoriteCount ? (
              <span className={metaTextClass} aria-hidden="true">
                ·
              </span>
            ) : null}
          </>
        ) : null}
        {hasFavoriteCount ? <ProductMetaItem label={`찜 ${favoriteCount}`} textClassName={metaTextClass} /> : null}
        {hasCreatedAt ? (
          <ProductMetaItem label={getTimeAgo(createdAt)} className="ml-auto text-gray-500" textClassName={metaTextClass} />
        ) : null}
      </div>
    </div>
  )
}
