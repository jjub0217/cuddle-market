'use client'

import { useState, useMemo } from 'react'
import ProductList from '@/components/product/ProductList'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import Tabs from '@/components/Tabs'
import { PRODUCT_TYPE_TABS, SORT_TYPE, type ProductTypeTabId } from '@/constants/constants'
import type { Product } from '@/types/product'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { SearchX } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/commons/button/Button'

interface ProductListHeaderProps {
  totalElements: number
}

function ProductListHeader({ totalElements }: ProductListHeaderProps) {
  return (
    <p className="text-sm text-gray-500" aria-live="polite">
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
}

export function ProductsSection({
  products,
  totalElements,
  activeTab,
  selectedSort = '최신순',
  onTabChange,
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
    <section role="tabpanel" id={`panel-${activeTabCode}`} aria-labelledby={activeTab} className="flex flex-col gap-2">
      {/* 탭 + 토글 + 정렬 */}
      <div className="border-outline-variant flex flex-col justify-between gap-4 border-b pb-2 md:flex-row md:items-center md:pt-15">
        <Tabs
          tabs={PRODUCT_TYPE_TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => onTabChange?.(tabId)}
          ariaLabel="상품 타입 분류"
          variant="card-pill"
        />

        <div className="flex flex-wrap items-center gap-4 md:gap-3">
          <label className="group flex cursor-pointer items-center gap-2.5">
            <span className="relative inline-block">
              <input
                type="checkbox"
                checked={onlyOnSale}
                onChange={(e) => setOnlyOnSale(e.target.checked)}
                className="peer sr-only"
              />
              <span className="block h-4 w-7 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#825500]"></span>
              <span className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span>
            </span>
            <span className="text-sm font-bold text-gray-600 group-hover:text-[#825500]">판매중만 보기</span>
          </label>

          <div className="bg-outline-variant/60 hidden h-4 w-px md:block" />

          {/* 모바일: SelectDropdown — 공간 효율 + 프로젝트 컨벤션 일치 */}
          <div className="w-32 md:hidden">
            <SelectDropdown
              value={selectedSort}
              onChange={handleSortChange}
              options={SORT_TYPE.map((sort) => ({ value: sort.label, label: sort.label }))}
              placeholder="최신순"
              buttonClassName="border-0 bg-[#f6efe2] text-gray-900 px-3 py-2 text-sm"
            />
          </div>

          {/* 데스크탑: 인라인 옵션 리스트 */}
          <div className="hidden items-center gap-2 md:flex">
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
                      'cursor-pointer p-0 text-sm whitespace-nowrap hover:no-underline',
                      isActive ? 'font-bold text-[#825500]' : 'font-medium text-gray-500 hover:text-[#825500]'
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

      <ProductListHeader totalElements={onlyOnSale ? visibleProducts.length : totalElements} />

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
