'use client'

import { useState, useMemo } from 'react'
import ProductList from '@/components/product/ProductList'
import Tabs from '@/components/Tabs'
import { PRODUCT_TYPE_TABS, SORT_TYPE, type ProductTypeTabId } from '@/constants/constants'
import type { Product } from '@/types/product'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/commons/button/Button'
import { SortDropdown } from './SortDropdown'

interface ProductListHeaderProps {
  totalElements: number
}

function ProductListHeader({ totalElements }: ProductListHeaderProps) {
  return (
    <p className="text-xs text-gray-500 md:text-sm" aria-live="polite">
      {`전체 ${totalElements}개`}
    </p>
  )
}

interface ProductsSectionProps {
  products: Product[]
  totalElements: number
  activeTab: ProductTypeTabId
  selectedSort?: string
  onTabChange?: (tabId: string) => void
  /** 좁은 화면에서 세부 필터 서랍을 연다. 없으면 그 단추를 안 그린다 */
  onOpenMobileFilter?: () => void
  /**
   * 세부 필터(상태·가격·지역)가 하나라도 걸려 있는가.
   *
   * ⚠️ 걸려 있으면 `⚙`에 **점**을 찍는다. 서랍 안으로 숨어서 열어 보기 전에는
   *    걸렸는지 알 수 없기 때문이다(#970). **앱도 같은 자리에 같은 점을 찍는다**
   *    (mobile/components/products/product-list-toolbar.tsx 의 filterDot).
   *    데스크탑에는 안 찍는다 — 거기는 세부 필터가 펼쳐져 있어 값이 그대로 보인다.
   */
  hasDetailFilter?: boolean
  /**
   * 좁은 화면에서 툴바를 **접는다** — 정렬을 드롭다운으로, 세부 필터를 서랍 단추로.
   *
   * ⚠️ **검색 결과에서만 켠다.** 홈은 둘러보러 온 화면이라 정렬 넷이 그대로 보이는 게 낫다.
   *    같은 폭에서 홈과 검색이 다른 얼굴을 갖는 셈인데, 이 저장소는 이미 그렇게 갈라 놓았다
   *    (#954 — 검색 중에는 필터 묶음을 감춘다).
   */
  compactMobileToolbar?: boolean
}

export function ProductsSection({
  products,
  totalElements,
  activeTab,
  selectedSort = '최신순',
  onTabChange,
  onOpenMobileFilter,
  hasDetailFilter = false,
  compactMobileToolbar = false,
}: ProductsSectionProps) {
  const { searchParams, pathname, push } = useFilterNavigation()
  const [onlyOnSale, setOnlyOnSale] = useState(false)

  const activeTabCode = PRODUCT_TYPE_TABS.find((tab) => tab.id === activeTab)?.code

  const handleSortChange = (label: string) => {
    const sortItem = SORT_TYPE.find((sort) => sort.label === label)

    if (!sortItem) return
    const params = new URLSearchParams(searchParams.toString())
    switch (sortItem.id) {
      case 'orderedLowPriced':
        params.set('sortBy', 'price')
        params.set('sortOrder', 'asc')
        break
      case 'orderedHighPriced':
        params.set('sortBy', 'price')
        params.set('sortOrder', 'desc')
        break
      default:
        params.set('sortBy', sortItem.id)
        params.delete('sortOrder')
    }
    push(`${pathname}?${params.toString()}`)
  }

  const visibleProducts = useMemo(() => {
    if (!onlyOnSale) return products
    return products.filter((product) => product.tradeStatus === 'SELLING' || product.tradeStatus === null)
  }, [products, onlyOnSale])

  return (
    <section role="tabpanel" id={`panel-${activeTabCode}`} aria-labelledby={activeTab} className="flex flex-col gap-4 md:gap-2">
      {/* 탭 + 토글 + 정렬 */}
      <div className="border-outline-variant flex flex-col justify-between gap-7 border-b pb-2 md:flex-row md:items-center md:gap-4 md:pt-15">
        <Tabs
          tabs={PRODUCT_TYPE_TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => onTabChange?.(tabId)}
          ariaLabel="상품 타입 분류"
          variant="card-pill"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
          <label className="group flex cursor-pointer items-center gap-2.5">
            <span className="relative inline-block">
              <input
                type="checkbox"
                checked={onlyOnSale}
                onChange={(e) => setOnlyOnSale(e.target.checked)}
                className="peer sr-only"
              />
              <span className="block h-4 w-7 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#825500]"></span>
              <span className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-3"></span>
            </span>
            <span className="text-sm text-gray-600 md:font-bold">판매중</span>
          </label>

          <div className="bg-outline-variant/60 hidden h-4 w-px md:block" />

          {/* 좁은 화면: [⚙ 필터] [최신순 ▾] — 앱의 목록 툴바와 같은 모양이다
              (mobile/components/products/product-list-toolbar.tsx).
              ⚠️ 넓은 화면(md~)에서는 아래 「정렬 인라인 옵션 리스트」가 대신 나온다.
                 좁은 화면에서 넷을 늘어놓으면 「판매중」 토글과 부딪혀 두 줄로 접혔다. */}
          {/* ⚠️ 값(크기·간격·색)은 앱 툴바에서 그대로 가져왔다 —
                 mobile/components/products/product-list-toolbar.tsx 의 iconButton · sortTrigger · right.
                 **앱에는 테두리도 배경도 없다.** 아이콘 하나와 글자뿐이다. */}
          <div className={cn('items-center gap-1 md:hidden', compactMobileToolbar ? 'flex' : 'hidden')}>
            {onOpenMobileFilter ? (
              <button
                type="button"
                aria-label={hasDetailFilter ? '세부 필터, 적용됨' : '세부 필터'}
                onClick={onOpenMobileFilter}
                className="relative flex size-8 cursor-pointer items-center justify-center"
              >
                <SlidersHorizontal size={18} strokeWidth={2} className="text-gray-600" aria-hidden="true" />
                {/* 걸려 있음을 알리는 점 — 앱과 같은 값이다(아이콘 오른쪽 위 · 6px · #825500) */}
                {hasDetailFilter ? (
                  <span className="absolute top-1.5 right-[5px] size-1.5 rounded-full bg-[#825500]" aria-hidden="true" />
                ) : null}
              </button>
            ) : null}
            <SortDropdown selectedSort={selectedSort} onSortChange={handleSortChange} />
          </div>

          {/* 정렬 인라인 옵션 리스트 — 접은 툴바일 때만 md 부터 나온다 */}
          <div className={cn('items-center gap-2 md:flex', compactMobileToolbar ? 'hidden' : 'flex')}>
            {SORT_TYPE.map((sort, idx) => {
              const isActive = selectedSort === sort.label
              return (
                <span key={sort.id} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => handleSortChange(sort.label)}
                    className={cn(
                      'cursor-pointer p-0 text-[13px] font-normal whitespace-nowrap hover:no-underline md:text-sm',
                      isActive ? 'text-[#825500] md:font-bold' : 'text-gray-500 hover:text-[#825500] md:font-medium'
                    )}
                  >
                    {sort.label}
                  </Button>
                  {idx < SORT_TYPE.length - 1 ? <span className="bg-outline-variant/60 h-3 w-px" /> : null}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* <ProductListHeader totalElements={onlyOnSale ? visibleProducts.length : totalElements} /> */}

      {visibleProducts.length > 0 ? (
        <ProductList products={visibleProducts} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-7 py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5e0]">
            <SearchX size={40} strokeWidth={1.5} className="text-[#825500]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-semibold text-gray-900 md:text-lg">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-500">다른 필터 조건으로 검색해보세요</p>
          </div>
        </div>
      )}
    </section>
  )
}
