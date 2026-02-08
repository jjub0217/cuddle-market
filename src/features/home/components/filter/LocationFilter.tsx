'use client'

import { useState, useEffect } from 'react'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { CITIES, PROVINCES } from '@/constants/cities'
import { cn } from '@/lib/utils/cn'
import type { Province } from '@/constants/cities'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface LocationFilterProps {
  headingClassName?: string
}

export function LocationFilter({ headingClassName }: LocationFilterProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isValidProvince = (value: string): value is Province => {
    return PROVINCES.includes(value as Province)
  }

  // URL에서 초기값 읽기
  const initialSido = searchParams.get('addressSido') || ''
  const initialGugun = searchParams.get('addressGugun') || ''

  const [selectedSido, setSelectedSido] = useState<Province | ''>(isValidProvince(initialSido) ? initialSido : '')
  const [selectedGugun, setSelectedGugun] = useState(initialGugun)

  // URL이 변경될 때 state 동기화 (뒤로가기 대응)
  useEffect(() => {
    const urlSido = searchParams.get('addressSido') || ''
    const urlGugun = searchParams.get('addressGugun') || ''
    setSelectedSido(isValidProvince(urlSido) ? urlSido : '')
    setSelectedGugun(urlGugun)
  }, [searchParams])

  // 선택된 시/도에 따른 구/군 목록
  const availableGugun = selectedSido ? CITIES[selectedSido] || [] : []

  // 시/도나 구/군이 변경되면 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedSido) {
      params.set('addressSido', selectedSido)
      if (selectedGugun) {
        params.set('addressGugun', selectedGugun)
      } else {
        params.delete('addressGugun')
      }
    } else {
      params.delete('addressSido')
      params.delete('addressGugun')
    }
    router.push(`${pathname}?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSido, selectedGugun])

  // 시/도가 변경되면 구/군 초기화
  const handleSidoChange = (value: string) => {
    setSelectedSido(value as Province | '')
    setSelectedGugun('') // 구/군 초기화
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <span id="location-filter-heading" className={cn('heading-h5', headingClassName)}>
        지역
      </span>
      <div className="flex flex-col gap-2.5 md:flex-row" role="group" aria-labelledby="location-filter-heading">
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
            buttonClassName="border-0 bg-primary-50 text-gray-900 px-3 py-2"
          />
        </div>

        {/* 구/군 선택 */}
        <div className="flex-1">
          <span id="gugun-description" className="sr-only">
            시/도 선택 후 이용 가능합니다
          </span>
          <SelectDropdown
            value={selectedGugun}
            onChange={(value: string) => setSelectedGugun(value)}
            options={availableGugun.map((gugun) => ({
              value: gugun,
              label: gugun,
            }))}
            placeholder={selectedSido ? '시/군/구 선택' : '시/도를 먼저 선택해주세요'}
            disabled={!selectedSido}
            buttonClassName="border-0 disabled:bg-primary-50 bg-primary-50 text-gray-900 px-3 py-2 disabled:text-gray-500"
          />
        </div>
      </div>
    </div>
  )
}
