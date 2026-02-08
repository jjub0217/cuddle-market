import { memo } from 'react'
import { DetailFilterButton } from './DetailFilterButton'
import { ProductStateFilter } from '@/components/product/ProductStateFilter'
import { PriceFilter } from './PriceFilter'
import { LocationFilter } from './LocationFilter'
import type { PriceRange } from '@/constants/constants'

interface DetailFilterProps {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  selectedProductStatus?: string | null
  selectedPriceRange?: PriceRange | null
  filterReset: (e: React.MouseEvent) => void
  headingClassName?: string
}

export const DetailFilter = memo(function DetailFilterSection({
  isOpen,
  onToggle,
  selectedProductStatus,
  selectedPriceRange,
  filterReset,
  headingClassName,
}: DetailFilterProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <DetailFilterButton isOpen={isOpen} onClick={() => onToggle(!isOpen)} ariaControls="detail-filter-content" filterReset={filterReset} />
      {isOpen && (
        <div
          className="bg-primary-100 flex flex-col gap-3.5 rounded-lg px-3 py-2.5 md:flex-row md:gap-10"
          role="group"
          id="detail-filter-content"
          aria-label="세부 필터 옵션"
        >
          <ProductStateFilter
            selectedProductStatus={selectedProductStatus}
            useUrlSync
            headingClassName={headingClassName}
          />
          <PriceFilter selectedPriceRange={selectedPriceRange} headingClassName={headingClassName} />
          <LocationFilter headingClassName={headingClassName} />
        </div>
      )}
    </div>
  )
})
