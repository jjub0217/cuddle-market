'use client'

import { CATEGORIES } from '@/constants/map'
import { useMapStore } from '@/store/mapStore'

export default function CategoryTabs() {
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const setSelectedCategory = useMapStore((s) => s.setSelectedCategory)

  return (
    <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-white px-4 py-3">
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setSelectedCategory(key)}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === key
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
