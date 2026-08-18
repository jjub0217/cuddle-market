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

          {/* ⚠️ **세 묶음을 가로로 붙이는 기준을 xl(1280)로 올렸다**(#956).
              md(768)이었는데, 980px 안팎(폰의 「데스크톱 사이트」 모드)에서 셋이 한 줄에
              들어가면 **지역 묶음이 남는 자리만 갖는다.** 그러면 고르는 칸이 아주 좁아지고,
              한글은 아무 데서나 줄바꿈이라 **「시/도 선택」이 한 글자씩 세로로 쪼개졌다.**

              하단 탭바가 xl 미만을 「모바일」로 보므로(BottomNav.tsx) 기준을 거기 맞춘다 —
              조각마다 기준이 다르면 **모바일 탭바 + 데스크탑 필터 배치**가 한 화면에 섞인다. */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
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
