'use client'

import ProductList from '@/components/product/ProductList'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { PRODUCT_TYPE_TABS, SORT_TYPE, type ProductTypeTabId, type SORT_LABELS } from '@/constants/constants'
import type { Product } from '@/types/product'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface ProductListHeaderProps {
  totalElements: number
}

function ProductListHeader({ totalElements }: ProductListHeaderProps) {
  return (
    <p className="text-text-secondary" aria-live="polite">
      {`총 ${totalElements}개의 상품`}
    </p>
  )
}

interface ProductsSectionProps {
  products: Product[]
  totalElements: number
  activeTab: ProductTypeTabId
  selectedSort?: SORT_LABELS
  setSelectedSort?: (sort: string) => void
  onSortChange?: (sort: SORT_LABELS) => void
}

export function ProductsSection({
  products,
  totalElements,
  activeTab,
  selectedSort = '최신순',
  setSelectedSort,
  onSortChange,
}: ProductsSectionProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

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
    router.push(`${pathname}?${params.toString()}`)
    setSelectedSort?.(sortItem.label)
    onSortChange?.(value as SORT_LABELS)
  }

  return (
    <section role="tabpanel" id={`panel-${activeTabCode}`} aria-labelledby={activeTab} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <ProductListHeader totalElements={totalElements} />
        <div className="w-36">
          <SelectDropdown
            value={selectedSort}
            onChange={handleSortChange}
            options={SORT_TYPE.map((sort) => ({
              value: sort.label,
              label: sort.label,
            }))}
            buttonClassName="border-0 bg-primary-50 text-gray-900 px-3 py-2"
          />
        </div>
      </div>
      <ProductList products={products} />
    </section>
  )
}
