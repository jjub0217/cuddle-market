'use client'

import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { CITIES, PROVINCES, type Province } from '@/constants/cities'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'

type LocationFilterVariant = 'default' | 'card-chip'

interface LocationFilterProps {
  headingClassName?: string
  variant?: LocationFilterVariant
}

const VARIANT_STYLES: Record<LocationFilterVariant, { sidoButton: string; gugunButton: string }> = {
  default: {
    sidoButton: 'border-0 bg-primary-50 text-gray-900 px-3 py-2',
    gugunButton:
      'border-0 disabled:bg-primary-50 bg-primary-50 text-gray-900 px-3 py-2 disabled:text-gray-500',
  },
  'card-chip': {
    sidoButton:
      'border border-[#d4c4b2] bg-white text-gray-900 px-4 py-2 text-[13px] focus:border-[#825500] focus:ring-2 focus:ring-[#825500]/20',
    gugunButton:
      'border border-[#d4c4b2] bg-white text-gray-900 px-4 py-2 text-[13px] disabled:bg-[#f6f3f2] disabled:text-gray-400 focus:border-[#825500] focus:ring-2 focus:ring-[#825500]/20',
  },
}

export function LocationFilter({ headingClassName, variant = 'default' }: LocationFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  const isValidProvince = (value: string): value is Province => {
    return PROVINCES.includes(value as Province)
  }

  // URL에서 직접 파생 (state 불필요)
  const urlSido = searchParams.get('addressSido') || ''
  const urlGugun = searchParams.get('addressGugun') || ''
  const selectedSido: Province | '' = isValidProvince(urlSido) ? urlSido : ''
  const selectedGugun = urlGugun

  // 선택된 시/도에 따른 구/군 목록
  const availableGugun = selectedSido ? CITIES[selectedSido] || [] : []

  // URL 업데이트 헬퍼
  const updateURL = (sido: Province | '', gugun: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sido) {
      params.set('addressSido', sido)
      if (gugun) {
        params.set('addressGugun', gugun)
      } else {
        params.delete('addressGugun')
      }
    } else {
      params.delete('addressSido')
      params.delete('addressGugun')
    }
    push(`${pathname}?${params.toString()}`)
  }

  // 시/도가 변경되면 구/군 초기화 + URL 업데이트
  const handleSidoChange = (value: string) => {
    const newSido = value as Province | ''
    updateURL(newSido, '')
  }

  // 구/군 변경 시 URL 업데이트
  const handleGugunChange = (value: string) => {
    updateURL(selectedSido, value)
  }

  const styles = VARIANT_STYLES[variant]

  return (
    <div className="flex flex-1 flex-col gap-2">
      <h4 id="location-filter-heading" className={headingClassName ?? 'heading-h4'}>
        지역
      </h4>
      <div
        className="flex flex-col gap-2.5 md:flex-row"
        role="group"
        aria-labelledby="location-filter-heading"
      >
        {/* 시/도 선택 */}
        <div className="flex-1">
          <SelectDropdown
            value={selectedSido}
            onChange={handleSidoChange}
            options={PROVINCES.map((province) => ({
              value: province,
              label: province,
            }))}
            placeholder="시/도 선택"
            buttonClassName={styles.sidoButton}
          />
        </div>

        {/* 구/군 선택 */}
        <div className="flex-1">
          <span id="gugun-description" className="sr-only">
            시/도 선택 후 이용 가능합니다
          </span>
          <SelectDropdown
            value={selectedGugun}
            onChange={handleGugunChange}
            options={availableGugun.map((gugun) => ({
              value: gugun,
              label: gugun,
            }))}
            placeholder={selectedSido ? '시/군/구 선택' : '시/도를 먼저 선택해주세요'}
            disabled={!selectedSido}
            buttonClassName={styles.gugunButton}
          />
        </div>
      </div>
    </div>
  )
}
