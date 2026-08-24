'use client'

import { Search } from 'lucide-react'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import type { FilterConfig, FilterState } from '../../types/adminTable'

interface AdminTableFiltersProps {
  filters: FilterConfig[]
  filterState: FilterState
  onFilterChange: (key: string, value: string) => void
  searchable?: boolean
  searchPlaceholder?: string
  search: string
  onSearchChange: (value: string) => void
}

export default function AdminTableFilters({
  filters,
  filterState,
  onFilterChange,
  searchable,
  searchPlaceholder = '검색...',
  search,
  onSearchChange,
}: AdminTableFiltersProps) {
  if (!searchable && filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 px-4 py-3">
      {searchable && (
        <div className="min-w-[240px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">검색</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
      )}
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">{filter.label}</label>
          <SelectDropdown
            value={filterState[filter.key] ?? ''}
            onChange={(value) => onFilterChange(filter.key, value)}
            options={[{ value: '', label: '전체' }, ...filter.options]}
            placeholder={filter.label}
            buttonClassName="py-2 text-sm"
          />
        </div>
      ))}
    </div>
  )
}
