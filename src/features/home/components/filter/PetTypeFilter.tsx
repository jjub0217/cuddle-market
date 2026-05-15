'use client'

import { PET_DETAILS, PET_TYPE_TABS, PETS, type PetTypeTabId } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { ProductPetTypeTabs } from '../tab/ProductPetTypeTabs'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import Button from '@/components/commons/button/Button'

const INITIAL_DISPLAY_COUNT = 13

interface PetTypeFilterProps {
  activeTab: PetTypeTabId
  onTabChange: (tabId: PetTypeTabId) => void
  headingClassName?: string
  selectedDetailPet?: string | null
}

// "전체" pill을 맨 앞에 두기 위한 sentinel — code: null
const ALL_ITEM = { code: null, name: '전체' } as const

export function PetTypeFilter({ activeTab, selectedDetailPet, onTabChange }: PetTypeFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()
  const [showAll, setShowAll] = useState(false)
  const isMobile = useMediaQuery('(max-width: 767px)')

  // null 입력 → 필터 클리어, 같은 code 재클릭 → 토글로 클리어, 다른 code → set
  const handleSelect = (e: React.MouseEvent, code: string | null) => {
    e.stopPropagation()
    const params = new URLSearchParams(searchParams.toString())
    if (code === null || selectedDetailPet === code) {
      params.delete('petDetailType')
    } else {
      params.set('petDetailType', code)
    }
    push(`${pathname}?${params.toString()}`)
  }

  const selectedPetTypeCode = PET_TYPE_TABS.find((tab) => tab.id === activeTab)?.code
  // 선택된 반려동물 타입에 해당하는 details만 필터링
  const filteredPetDetails =
    selectedPetTypeCode === 'ALL'
      ? PET_DETAILS // 전체 선택 시 모든 details 표시
      : PET_DETAILS.filter((pet) =>
          PETS.find((petType) => petType.code === selectedPetTypeCode)?.details.some((detail) => detail.code === pet.code)
        )

  // 모바일 + "전체" 탭일 때만 더보기 기능 적용 (데스크탑은 항상 전체 표시)
  const displayedPetDetails =
    isMobile && selectedPetTypeCode === 'ALL' && !showAll
      ? filteredPetDetails.slice(0, INITIAL_DISPLAY_COUNT)
      : filteredPetDetails

  const hasMoreItems = isMobile && selectedPetTypeCode === 'ALL' && filteredPetDetails.length > INITIAL_DISPLAY_COUNT

  // "전체" pill을 첫 항목으로 prepend
  const items: ReadonlyArray<{ code: string | null; name: string }> = [ALL_ITEM, ...displayedPetDetails]

  const [prevActiveTab, setPrevActiveTab] = useState(activeTab)
  if (prevActiveTab !== activeTab) {
    setPrevActiveTab(activeTab)
    setShowAll(false)
  }

  return (
    <div className="flex flex-col gap-3.5">
      <ProductPetTypeTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex flex-wrap gap-1.5" role="tabpanel" id={`panel-${selectedPetTypeCode}`} aria-labelledby={activeTab}>
        {items.map((pet) => {
          const isActive = pet.code === null ? !selectedDetailPet : selectedDetailPet === pet.code
          return (
            <Button
              key={pet.code ?? 'all'}
              type="button"
              size="sm"
              onClick={(e) => handleSelect(e, pet.code)}
              aria-pressed={isActive}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'border-[#825500] bg-[#825500] text-white shadow-sm'
                  : 'border-outline-variant bg-white text-gray-600 hover:border-[#825500] hover:text-[#825500]'
              )}
            >
              {pet.name}
            </Button>
          )
        })}
        {hasMoreItems && !showAll ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAll(true)}
            className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 md:hidden"
          >
            더보기 ({filteredPetDetails.length - INITIAL_DISPLAY_COUNT}개)
          </Button>
        ) : null}
      </div>
    </div>
  )
}
