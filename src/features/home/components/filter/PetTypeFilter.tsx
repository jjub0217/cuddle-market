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
  // ⚠️ **기준을 1279px 로 올렸다**(#956). 767 이었을 때는 980px 안팎(폰의 「데스크톱 사이트」
  //    모드)에서 「모바일이 아니다」로 보고 소분류 알약을 **네 줄까지 다 펼쳤다.**
  //    하단 탭바는 같은 폭을 「모바일」로 본다(BottomNav.tsx 의 min-width: 1280px) —
  //    **같은 물음에 두 조각이 다른 숫자로 답하면** 한 화면에 두 얼굴이 섞인다.
  const isMobile = useMediaQuery('(max-width: 1279px)')

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
                // h-6.5 (26) — Button 의 sm(36)보다 작다. 목록 위에 여럿이 늘어서는 칩이라
                // 단추만 한 크기면 화면을 다 잡아먹는다(#847).
                'h-[26px] cursor-pointer rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-all',
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
            // ⚠️ 접는 기준도 xl(1280)로 올렸다(#956). md 였을 때는 980px 안팎에서 이 단추가
            //    숨겨져 **소분류 알약이 네 줄까지 펼쳐졌다.** 하단 탭바와 같은 기준을 쓴다.
            className="h-[26px] cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 xl:hidden"
          >
            더보기 ({filteredPetDetails.length - INITIAL_DISPLAY_COUNT}개)
          </Button>
        ) : null}
      </div>
    </div>
  )
}
