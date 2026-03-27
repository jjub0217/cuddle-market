'use client'

import ProductList from '@/components/product/ProductList'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { PRODUCT_TYPE_TABS, SORT_TYPE, type ProductTypeTabId } from '@/constants/constants'
import type { Product } from '@/types/product'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { SearchX } from 'lucide-react'

interface ProductListHeaderProps {
  totalElements: number
}

function ProductListHeader({ totalElements }: ProductListHeaderProps) {
  return (
    <p className="text-text-secondary text-sm" aria-live="polite">
      {`총 ${totalElements}개의 상품`}
    </p>
  )
}

interface ProductsSectionProps {
  products: Product[]
  totalElements: number
  activeTab: ProductTypeTabId
  selectedSort?: string
}

export function ProductsSection({ products, totalElements, activeTab, selectedSort = '최신순' }: ProductsSectionProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  const activeTabCode = PRODUCT_TYPE_TABS.find((tab) => tab.id === activeTab)?.code

  const handleSortChange = (value: string) => {
    const sortItem = SORT_TYPE.find((sort) => sort.label === value)

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
    <section role="tabpanel" id={`panel-${activeTabCode}`} aria-labelledby={activeTab} className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <ProductListHeader totalElements={totalElements} />
        <div className="w-36">
          <SelectDropdown
            value={selectedSort}
            onChange={handleSortChange}
            options={SORT_TYPE.map((sort) => ({
              value: sort.label,
              label: sort.label,
            }))}
            placeholder="최신순"
            buttonClassName="border-0 bg-primary-50 text-gray-900 px-3 py-2 text-[13px]"
          />
        </div>
      </div>
      {products.length > 0 ? (
        <ProductList products={products} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-gray-300 bg-white px-7 py-12 md:gap-6 md:py-16">
          <div className="bg-primary-50 flex h-16 w-16 items-center justify-center rounded-full md:h-25 md:w-25">
            <SearchX size={32} strokeWidth={1} className="text-primary-300 md:size-[50px]" />
          </div>
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <p className="text-base font-semibold md:heading-h5">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-500">다른 필터 조건으로 검색해보세요</p>
          </div>
        </div>
      )}
    </section>
  )
}
