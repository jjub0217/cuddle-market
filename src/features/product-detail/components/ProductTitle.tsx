import { getPriceLabel } from '@cuddle/shared'
import { formatPrice } from '@/lib/utils/formatPrice'

interface ProductTitleProps {
  title: string
  productType: string
  price: number
}

export default function ProductTitle({ title, price, productType }: ProductTitleProps) {
  // 판매요청이면 「희망」. 판매면 null 이라 안 그린다(#1113).
  const priceLabel = getPriceLabel(productType)

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <h1 className="md:heading-h4 text-2xl leading-7 font-semibold text-gray-900 md:leading-none">{title}</h1>
      <strong className="heading-h3 max-w-[90%] overflow-hidden text-[23px] leading-none text-gray-900">
        {/* ⚠️ **값보다 작게 그린다.** 이 화면은 제목(24/600)과 가격(23/700)이 크기·굵기가
            거의 같아서, 「희망」을 값과 같은 크기로 두면 **두 줄이 한 덩어리로 읽힌다**
            (2026-09-01 실제 화면에서 걸렸다).

            ⚠️ **색과 굵기는 값과 같이 둔다**(바깥 strong 이 준다 — 700·gray-900).
               연하게 빼면 「희망」이 가격 덩어리에서 떨어져 나와 시간·지역 같은
               **메타 정보처럼** 보인다. 이 말은 가격을 꾸미는 말이라 가격에 붙어야 한다.
               크기 차이(23 → 16)만으로 제목과는 이미 갈린다 */}
        {priceLabel ? (
          <span className="mr-1 align-middle text-base">{priceLabel}</span>
        ) : null}
        <span className="leading-none">{formatPrice(price)}</span>원
      </strong>
      {/* <span className="text-base font-semibold text-gray-500">{productTypeName}</span> */}
    </div>
  )
}
