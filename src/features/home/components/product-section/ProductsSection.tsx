'use client'

import ProductList from '@/components/product/ProductList'
import Tabs from '@/components/Tabs'
import { PRODUCT_TYPE_TABS, SORT_TYPE, type ProductTypeTabId } from '@/constants/constants'
import type { Product } from '@/types/product'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/commons/button/Button'
import { SortDropdown } from './SortDropdown'
import { productListLabel } from '@/features/home/productListLabel'

interface ProductListHeaderProps {
  totalElements: number
  /** 검색 중이면 검색어. 없으면(홈) 개수만 적는다 */
  keyword?: string | null
}

function ProductListHeader({ totalElements, keyword }: ProductListHeaderProps) {
  // ⚠️ 크기를 「판매중」 토글 글자와 **같게** 맞춘다(둘 다 `text-sm`). 좁은 폭에서 바로 위아래에
  //    놓이는 두 글자라 크기가 다르면 층이 어긋나 보인다.
  //
  // ⚠️ 문구는 `productListLabel` 이 만든다 — 하이드레이션 전에는 StaticHomeFallback 이
  //    같은 자리를 그리므로 **두 곳이 같은 말을 써야 한다.** 까닭은 그 파일 주석에 있다.
  //
  // ⚠️ 검색칸에 `maxLength` 가 없어 검색어가 얼마든지 길 수 있다. `truncate` 로 한 줄에서 자른다.
  return (
    <p className="truncate text-sm text-gray-500" aria-live="polite">
      {productListLabel(totalElements, keyword)}
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
  /** 검색 중이면 검색어. 목록 위 개수 줄에 같이 적는다(#1026) */
  keyword?: string | null
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
  keyword,
}: ProductsSectionProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  /**
   * 「판매중」 토글 — **주소에 싣는다**(#1009).
   *
   * ⚠️ 조각 안 상태로 두면 목록 질의의 열쇠(productListQueryKey)가 안 바뀌어
   *    **다시 안 받아온다.** 열쇠는 주소에서만 만들어지고 SSR 프리페치도 같은 열쇠를 쓴다.
   *    그래서 받아온 20개 중에서 화면이 남기는 꼴이 되어 뒤 페이지의 판매중 상품이 안 보였다.
   *    이 저장소는 이미 필터를 전부 주소에 넣어 왔다(#319) — 같은 방법을 쓴다.
   *
   * ⚠️ 꺼짐이면 값을 「전체」 같은 것으로 두지 않고 **파라미터를 아예 뺀다**(「전체는 빈 값」).
   *    `SELLING` 을 물으면 거래 상태가 없는 판매요청 상품도 서버가 함께 준다.
   */
  const onlyOnSale = searchParams.get('tradeStatuses') === 'SELLING'

  const handleOnlyOnSaleChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set('tradeStatuses', 'SELLING')
    } else {
      params.delete('tradeStatuses')
    }
    push(`${pathname}?${params.toString()}`)
  }

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

  return (
    <section role="tabpanel" id={`panel-${activeTabCode}`} aria-labelledby={activeTab} className="flex flex-col gap-2">
      {/* 탭 + 토글 + 정렬 */}
      <div className="border-outline-variant flex flex-col justify-between gap-3 border-b pb-2 md:flex-row md:items-center md:gap-4 md:pt-15">
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
                onChange={(e) => handleOnlyOnSaleChange(e.target.checked)}
                className="peer sr-only"
              />
              <span className="block h-4 w-7 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-600"></span>
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
                  <span className="absolute top-1.5 right-[5px] size-1.5 rounded-full bg-primary-600" aria-hidden="true" />
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
                      isActive ? 'text-primary-600 md:font-bold' : 'text-gray-500 hover:text-primary-600 md:font-medium'
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

      <ProductListHeader totalElements={totalElements} keyword={keyword} />

      {products.length > 0 ? (
        <ProductList products={products} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-7 py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5e0]">
            <SearchX size={40} strokeWidth={1.5} className="text-primary-600" />
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
