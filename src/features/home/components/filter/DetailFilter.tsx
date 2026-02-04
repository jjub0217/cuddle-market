import { memo } from 'react'
import { DetailFilterButton } from './DetailFilterButton'
import { ProductStateFilter } from '@/components/product/ProductStateFilter'
import { PriceFilter } from './PriceFilter'
import { LocationFilter } from './LocationFilter'
import type { PriceRange, LocationFilter as LocationFilterType } from '@/constants/constants'

interface DetailFilterProps {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  selectedProductStatus?: string | null
  onProductStatusChange?: (status: string | null) => void
  selectedPriceRange?: PriceRange | null
  onMinPriceChange?: (priceRange: PriceRange | null) => void
  onLocationChange?: (location: LocationFilterType | null) => void
  filterReset: (e: React.MouseEvent) => void
  headingClassName?: string
}

export const DetailFilter = memo(function DetailFilterSection({
  isOpen,
  onToggle,
  selectedProductStatus,
  onProductStatusChange,
  selectedPriceRange,
  onMinPriceChange,
  onLocationChange,
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
            onProductStatusChange={onProductStatusChange}
            useUrlSync
            headingClassName={headingClassName}
          />
          <PriceFilter selectedPriceRange={selectedPriceRange} onMinPriceChange={onMinPriceChange} headingClassName={headingClassName} />
          <LocationFilter onLocationChange={onLocationChange} headingClassName={headingClassName} />
        </div>
      )}
    </div>
  )
})
