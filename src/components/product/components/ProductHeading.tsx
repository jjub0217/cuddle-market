import { getPriceLabel } from '@cuddle/shared'
import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductHeadingProps {
  title: string
  price: number
  /**
   * 상품 갈래 코드. 판매요청이면 가격 앞에 「희망」이 붙는다(#1113).
   *
   * 같은 「12,000원」이 판매는 "이 값에 팝니다", 판매요청은 "이 값에 사고 싶어요"로
   * 뜻이 반대인데 카드만 보면 갈리지 않아서다. 앱 카드도 같은 자리에 같은 말을 붙인다
   * (`product-card.tsx`).
   */
  productType?: string | null
}

export function ProductHeading({ title, price, productType }: ProductHeadingProps) {
  const priceLabel = getPriceLabel(productType)

  return (
    <div className="flex flex-col">
      <h3 className="line-clamp-1 text-[14px] text-gray-900">{title}</h3>
      <span className="max-w-[90%] overflow-hidden font-bold text-gray-900 md:text-base">
        {/* 값보다 **작게만** — 색·굵기는 값과 같이 둔다(바깥 span 이 준다).
            연하게 빼면 가격 덩어리에서 떨어져 나와 메타 정보처럼 보인다(상세와 같은 규칙).
            ⚠️ `StaticHomeFallback` 도 **같은 크기**로 그린다. 다르면 화면이 뜨는 순간
               글자가 튄다 */}
        {priceLabel ? (
          <span className="mr-1 text-xs">{priceLabel}</span>
        ) : null}
        <span>{formatPrice(price)}</span>원
      </span>
    </div>
  )
}
