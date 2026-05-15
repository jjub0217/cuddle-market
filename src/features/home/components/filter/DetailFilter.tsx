'use client'

import { memo } from 'react'
import { type PriceRange } from '@/constants/constants'
import { RotateCcw } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { ProductStateFilter } from '@/components/product/ProductStateFilter'
import { PriceFilter } from './PriceFilter'
import { LocationFilter } from './LocationFilter'
import { DetailFilterButton } from './DetailFilterButton'

interface DetailFilterProps {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  selectedProductStatus?: string | null
  selectedPriceRange?: PriceRange | null
  filterReset: (e: React.MouseEvent) => void
  headingClassName?: string
}

const SECTION_HEADING_CLASS = 'mb-1 text-[13px] font-bold text-gray-900'
const FILTER_CONTENT_ID = 'detail-filter-content'

export const DetailFilter = memo(function DetailFilterSection({
  isOpen,
  onToggle,
  selectedProductStatus,
  selectedPriceRange,
  filterReset,
}: DetailFilterProps) {
  return (
    <div className="flex flex-col gap-3 max-md:border-outline-variant max-md:rounded-3xl max-md:border max-md:bg-white max-md:px-4 max-md:py-3 max-md:shadow-sm">
      <DetailFilterButton
        isOpen={isOpen}
        onToggle={() => onToggle(!isOpen)}
        filterReset={filterReset}
        ariaControls={FILTER_CONTENT_ID}
      />

      {isOpen ? (
        <div
          id={FILTER_CONTENT_ID}
          role="group"
          aria-label="세부 필터 옵션"
          className="relative md:border-outline-variant md:rounded-3xl md:border md:bg-white md:px-6 md:py-5 md:shadow-sm"
        >
          {/* 데스크탑 필터 초기화 (카드 우상단 액션) */}
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={filterReset}
            className="absolute top-6 right-6 hidden cursor-pointer items-center gap-1 p-0 text-xs font-medium text-gray-500 hover:text-[#825500] hover:no-underline md:top-4 md:right-6 md:flex"
          >
            <RotateCcw size={12} aria-hidden="true" />
            필터 초기화
          </Button>

          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-10">
            <ProductStateFilter
              variant="card-chip"
              useUrlSync
              selectedProductStatus={selectedProductStatus}
              headingClassName={SECTION_HEADING_CLASS}
            />
            <PriceFilter variant="card-chip" selectedPriceRange={selectedPriceRange} headingClassName={SECTION_HEADING_CLASS} />
            <LocationFilter variant="card-chip" headingClassName={SECTION_HEADING_CLASS} />
          </div>
        </div>
      ) : null}
    </div>
  )
})
