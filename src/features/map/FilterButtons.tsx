'use client'

import { HOSPITAL_FILTERS } from '@/constants/map'
import { useMapStore } from '@/store/mapStore'

export default function FilterButtons() {
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const activeFilters = useMapStore((s) => s.activeFilters)
  const toggleFilter = useMapStore((s) => s.toggleFilter)

  if (selectedCategory !== 'HOSPITAL') return null

  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2">
      {HOSPITAL_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => toggleFilter(key)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition-colors ${
            activeFilters.includes(key)
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
