import type { Product } from '@/types/product'
import { IMAGE_SIZES } from '@/lib/utils/imageUrl'
import { FallbackImage } from './FallbackImage'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getProductStatus } from '@/lib/utils/getProductStatus'
import { getProductType } from '@/lib/utils/getProductType'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { getPriceLabel, getTimeAgo } from '@cuddle/shared'
import { formatPrice } from '@/lib/utils/formatPrice'
import { cn } from '@/lib/utils/cn'
import Badge from '@/components/commons/badge/Badge'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { PAGE_CONTAINER } from '@/constants/ui'
import { productListLabel } from '@/features/home/productListLabel'

/**
 * Suspense fallback용 서버 컴포넌트
 *
 * Home 컴포넌트가 useSearchParams()로 인해 Suspense bailout되는 동안,
 * 초기 HTML에 실제 상품 이미지(<img> 태그)를 포함시켜 LCP를 개선한다.
 *
 * - 서버 컴포넌트이므로 초기 HTML에 직접 렌더링됨
 * - Home과 동일한 레이아웃 구조를 유지하여 CLS 방지
 * - 필터/탭은 비인터랙티브 플레이스홀더로 렌더링
 * - Hydration 후 Home이 이 컴포넌트를 대체함
 */

interface StaticHomeFallbackProps {
  products: Product[]
  totalElements: number
  /** 검색 중이면 검색어. 하이드레이션 뒤 이 자리를 대신하는 ProductsSection 과 **같은 문구**여야 한다 */
  keyword?: string | null
}

export default function StaticHomeFallback({ products, totalElements, keyword }: StaticHomeFallbackProps) {
  return (
    <div className="pb-4xl pt-6">
      <div className={PAGE_CONTAINER}>
        <div className="flex flex-col gap-12">
          {/* 필터 영역 플레이스홀더 (Home의 PetTypeFilter + CategoryFilter + DetailFilter 자리) */}
          <div className="flex flex-col gap-7">
            <FilterPlaceholder />
          </div>

          {/* 상품 영역 */}
          <div className="flex flex-col gap-3">
            {/* 탭 플레이스홀더 (Home의 Tabs 자리) */}
            <TabsPlaceholder />

            {/* 실제 상품 데이터 렌더링 */}
            <section className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                {/* 문구는 ProductsSection 의 개수 줄과 **한 곳에서** 만든다 — 다르면
                    Home 이 이 대역을 대신하는 순간 글자가 튄다(productListLabel 주석 참고). */}
                <p className="text-text-secondary truncate">{productListLabel(totalElements, keyword)}</p>
                <div className="w-36">
                  <div className="bg-primary-50 rounded px-3 py-2 text-gray-900 text-sm">최신순</div>
                </div>
              </div>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {products.map((product, index) => (
                  <li key={product.id}>
                    <StaticProductCard product={product} index={index} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <div className="h-10" aria-hidden="true" />
      </div>
    </div>
  )
}

function FilterPlaceholder() {
  return (
    <>
      {/* PetTypeFilter 자리 */}
      <div className="flex flex-col gap-3">
        <div className="heading-h5 h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-10 w-16 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
      </div>
      {/* CategoryFilter 자리 */}
      <div className="flex flex-col gap-3">
        <div className="heading-h5 h-6 w-20 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-10 w-20 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
      </div>
    </>
  )
}

function TabsPlaceholder() {
  return (
    <div className="flex gap-1" role="tablist">
      {['전체', '판매', '판매요청'].map((label) => (
        <div
          key={label}
          className="text-text-secondary rounded-lg px-4 py-2 text-sm font-medium"
        >
          {label}
        </div>
      ))}
    </div>
  )
}

function StaticProductCard({ product, index }: { product: Product; index: number }) {
  const { id, title, price, mainImageUrl, petDetailType, productStatus, tradeStatus, createdAt, favoriteCount, productType } = product
  const petTypeName = getPetTypeName(petDetailType)
  const productStatusName = getProductStatus(productStatus)
  const productTradeName = getTradeStatus(tradeStatus)
  const productTypeName = getProductType(productType)
  const productTradeColor = getTradeStatusColor(tradeStatus)
  const priority = index < 4

  const isRequest = productType === 'REQUEST'

  const displayTradeStatus = (() => {
    if (productTypeName === '판매요청') {
      if (productTradeName === '판매완료') return '요청완료'
      if (!productTradeName) return '요청중'
    }
    return productTradeName
  })()

  // 요청 카드는 썸네일을 안 그려서(아래) 거기 얹히던 거래상태 뱃지도 같이 사라진다.
  // 하이드레이션 뒤 자리를 대신하는 `ProductCard` 는 그 값을 글자 영역 뱃지로 옮겨 그리므로,
  // 여기서도 같이 그려야 바뀌는 순간 글자가 안 튄다. 그릴 조건도 같다 — 예약중·완료계열만.
  const requestTradeStatus = isRequest && (tradeStatus === 'RESERVED' || tradeStatus === 'COMPLETED') ? displayTradeStatus : null

  return (
    <Link
      className="border-border text-text-primary flex cursor-pointer flex-row-reverse overflow-hidden rounded-xl border bg-white shadow-md transition-shadow duration-200 hover:shadow-xl md:flex-col-reverse"
      aria-label={`${title}, ${price}원, ${productStatusName}, ${petTypeName}, ${productTradeName}`}
      href={ROUTES.DETAIL_ID(id, title)}
    >
      {/* ProductInfo */}
      <div className="flex h-full flex-1 flex-col justify-between gap-5 p-3 md:flex-none">
        <div className="flex flex-col gap-2">
          <span className="heading-h5 line-clamp line-1 text-gray-900">{title}</span>
          {requestTradeStatus ? (
            <Badge className="w-fit rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              {requestTradeStatus}
            </Badge>
          ) : null}
          <p className="flex w-full flex-col">
            <span className="font-semibold text-gray-500">{productTypeName}</span>
            {/* 판매요청이면 「희망」이 앞에 붙는다(#1113).
                ⚠️ **`ProductCard` 와 같은 규칙이라야 한다.** 여기만 빼면 하이드레이션
                   순간에 「20,000원」이 「희망 20,000원」으로 바뀌며 글자가 튄다
                   (파일 맨 위 「CLS 방지」 주석과 같은 까닭). */}
            <span className="text-gray-900 max-w-[90%] overflow-hidden font-bold">
              {/* ⚠️ **`ProductHeading` 과 크기까지 같아야 한다.** 여기만 다르면
                     하이드레이션 순간에 글자가 튄다(파일 맨 위 「CLS 방지」 주석) */}
              {getPriceLabel(productType) ? (
                <span className="mr-1 text-xs">{getPriceLabel(productType)}</span>
              ) : null}
              <span>{formatPrice(price)}</span>원
            </span>
          </p>
        </div>
        <div className="flex w-full justify-between">
          <span className="font-medium whitespace-nowrap text-gray-400 lg:text-sm">{getTimeAgo(createdAt)}</span>
          <span className="font-medium whitespace-nowrap text-gray-400 lg:text-sm">{favoriteCount}</span>
        </div>
      </div>

      {/* ProductThumbnail — 판매요청은 안 그린다.
          이 조각은 하이드레이션 전까지만 보이고 곧 ProductCard 가 자리를 대신한다. 그래서
          **ProductCard 와 같은 규칙으로 갈라야** 한다 — 여기만 썸네일을 그리면 하이드레이션
          순간에 그림이 사라지며 글자가 튄다(파일 맨 위 「CLS 방지」 주석). */}
      {isRequest ? null : (
        <div className="relative flex-1 overflow-hidden pb-[35%] md:flex-none md:pb-[75%]">
          <div className="top-sm px-sm absolute flex w-full justify-between">
            <div className="gap-xs z-1 flex flex-wrap">
              <Badge className="bg-primary-700 text-white">{petTypeName}</Badge>
              <Badge className="bg-primary-200 text-gray-900">{productStatusName}</Badge>
            </div>
          </div>
          <Badge className={cn('bottom-sm right-sm absolute z-1 text-white', productTradeColor)}>
            {displayTradeStatus}
          </Badge>
          <FallbackImage
            imageUrl={mainImageUrl}
            alt={title}
            sizes={IMAGE_SIZES.productThumbnail}
            priority={priority}
            className="t-0 l-0 absolute h-full w-full object-cover"
          />
        </div>
      )}
    </Link>
  )
}
