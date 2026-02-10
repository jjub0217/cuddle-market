import type { Product } from '@/types/product'
import {
  getImageSrcSet,
  IMAGE_SIZES,
  toResizedWebpUrl,
  PLACEHOLDER_IMAGES,
  PLACEHOLDER_SRCSET,
} from '@/lib/utils/imageUrl'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getProductStatus } from '@/lib/utils/getProductStatus'
import { getProductType } from '@/lib/utils/getProductType'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { formatPrice } from '@/lib/utils/formatPrice'
import { cn } from '@/lib/utils/cn'
import Badge from '@/components/commons/badge/Badge'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

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
}

export default function StaticHomeFallback({ products, totalElements }: StaticHomeFallbackProps) {
  return (
    <div className="pb-4xl bg-white pt-6">
      <div className="px-lg mx-auto max-w-7xl">
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
                <p className="text-text-secondary">{`총 ${totalElements}개의 상품`}</p>
                <div className="w-36">
                  <div className="bg-primary-50 rounded px-3 py-2 text-gray-900 text-sm">최신순</div>
                </div>
              </div>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
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

  const displayTradeStatus = (() => {
    if (productTypeName === '판매요청') {
      if (productTradeName === '판매완료') return '요청완료'
      if (!productTradeName) return '요청중'
    }
    return productTradeName
  })()

  return (
    <Link
      className="border-border text-text-primary flex cursor-pointer flex-row-reverse overflow-hidden rounded-xl border bg-white shadow-md transition-shadow duration-200 hover:shadow-xl md:flex-col-reverse"
      aria-label={`${title}, ${price}원, ${productStatusName}, ${petTypeName}, ${productTradeName}`}
      href={ROUTES.DETAIL_ID(id)}
    >
      {/* ProductInfo */}
      <div className="flex h-full flex-1 flex-col justify-between gap-5 p-3 md:flex-none">
        <div className="flex flex-col gap-2">
          <span className="heading-h5 line-clamp line-1 text-gray-900">{title}</span>
          <p className="flex w-full flex-col">
            <span className="font-semibold text-gray-500">{productTypeName}</span>
            <span className="text-primary-300 max-w-[90%] overflow-hidden font-bold">
              <span>{formatPrice(price)}</span>원
            </span>
          </p>
        </div>
        <div className="flex w-full justify-between">
          <span className="font-medium whitespace-nowrap text-gray-400 lg:text-sm">{getTimeAgo(createdAt)}</span>
          <span className="font-medium whitespace-nowrap text-gray-400 lg:text-sm">{favoriteCount}</span>
        </div>
      </div>

      {/* ProductThumbnail */}
      <div className="relative flex-1 overflow-hidden pb-[35%] md:flex-none md:pb-[75%]">
        <div className="top-sm px-sm absolute flex w-full justify-between">
          <div className="gap-xs z-1 flex flex-wrap">
            <Badge className="bg-primary-700 text-white">{petTypeName}</Badge>
            {productTypeName !== '판매요청' && (
              <Badge className="bg-primary-200 text-gray-900">{productStatusName}</Badge>
            )}
          </div>
        </div>
        <Badge className={cn('bottom-sm right-sm absolute z-1 text-white', productTradeColor)}>
          {displayTradeStatus}
        </Badge>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={title}
          src={mainImageUrl ? toResizedWebpUrl(mainImageUrl, 800) : PLACEHOLDER_IMAGES[800]}
          srcSet={mainImageUrl ? getImageSrcSet(mainImageUrl) : PLACEHOLDER_SRCSET}
          sizes={IMAGE_SIZES.productThumbnail}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          className="t-0 l-0 absolute h-full w-full object-cover"
        />
      </div>
    </Link>
  )
}
