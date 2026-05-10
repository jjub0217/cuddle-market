'use client'

import { useMapStore } from '@/store/mapStore'
import { ANIMAL_TYPE_LABELS } from '@/constants/map'
import { FiPhone, FiMapPin, FiStar, FiX } from 'react-icons/fi'

export default function PlaceDetailSidebar() {
  const selectedPlace = useMapStore((s) => s.selectedPlace)
  const setSelectedPlace = useMapStore((s) => s.setSelectedPlace)

  if (!selectedPlace) return null

  return (
    <div className="hidden w-[360px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:block">
      <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <h2 className="text-lg font-bold">{selectedPlace.name}</h2>
        <button
          onClick={() => setSelectedPlace(null)}
          className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {selectedPlace.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={selectedPlace.imageUrl}
            alt={selectedPlace.name}
            className="h-48 w-full rounded-lg object-cover"
          />
        )}

        <div className="flex flex-wrap gap-2">
          {selectedPlace.isRecommended && (
            <span className="bg-badge-yellow-container text-badge-yellow rounded-full px-3 py-1 text-xs font-medium">
              추천
            </span>
          )}
          {selectedPlace.detail?.is24Hours && (
            <span className="bg-badge-blue-container text-badge-blue rounded-full px-2.5 py-1 text-xs">
              24시간
            </span>
          )}
          {selectedPlace.detail?.isEmergencyAvailable && (
            <span className="bg-badge-red-container text-badge-red rounded-full px-2.5 py-1 text-xs">
              응급진료
            </span>
          )}
          {selectedPlace.detail?.animalTypes.map((type) => (
            <span
              key={type}
              className="bg-badge-green-container text-badge-green rounded-full px-2.5 py-1 text-xs"
            >
              {ANIMAL_TYPE_LABELS[type] ?? type}
            </span>
          ))}
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span>{selectedPlace.address}</span>
          </div>

          {selectedPlace.phone && (
            <div className="flex items-center gap-2">
              <FiPhone className="h-4 w-4 shrink-0 text-gray-400" />
              <a
                href={`tel:${selectedPlace.phone}`}
                className="text-primary-container underline"
              >
                {selectedPlace.phone}
              </a>
            </div>
          )}

        </div>

        {selectedPlace.reviewSummary && (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
            <FiStar className="h-4 w-4 text-yellow-400" />
            <span className="font-medium">
              {selectedPlace.reviewSummary.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              ({selectedPlace.reviewSummary.reviewCount}개 리뷰)
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
