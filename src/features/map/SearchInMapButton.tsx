'use client'

import { useMapStore } from '@/store/mapStore'

interface SearchInMapButtonProps {
  onSearch: () => void
}

export default function SearchInMapButton({ onSearch }: SearchInMapButtonProps) {
  const needsSearch = useMapStore((s) => s.needsSearch)
  const selectedPlace = useMapStore((s) => s.selectedPlace)

  if (!needsSearch) return null

  return (
    <button
      onClick={onSearch}
      className={`absolute left-1/2 -translate-x-1/2 z-10 rounded-full bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-50 active:bg-gray-100 ${selectedPlace ? 'bottom-48' : 'bottom-16 xl:bottom-10'}`}
    >
      현 지도에서 검색
    </button>
  )
}
