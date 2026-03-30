'use client'

import { useMapStore } from '@/store/mapStore'
import { CATEGORIES, HOSPITAL_FILTERS, ANIMAL_TYPE_LABELS } from '@/constants/map'
import { getPlaceDetail } from '@/lib/api/places'
import { FiStar } from 'react-icons/fi'

function getCategoryLabel(category: string) {
  return CATEGORIES.find((c) => c.key === category)?.label ?? category
}

function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function shortenAddress(address: string): string {
  const parts = address.trim().split(' ')
  const result: string[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // 도 단위 제거 (경기도, 충청북도 등)
    if (/^.+도$/.test(part) && !/(시|구|동|읍|면)/.test(part)) continue

    // 시 축약 ("고양시" → "고양", "서울특별시" → "서울")
    if (/(특별시|광역시|특별자치시|특별자치도|시)$/.test(part)) {
      result.push(part.replace(/(특별시|광역시|특별자치시|특별자치도|시)$/, ''))
      continue
    }

    // 구/군
    if (/(구|군)$/.test(part)) {
      result.push(part)
      continue
    }

    // 동/읍/면/리/가 → 여기서 종료
    if (/(동|읍|면|리|가)$/.test(part)) {
      result.push(part)
      break
    }

    // 도로명 (위에 해당 안 되는 경우) → 추가하고 종료
    if (result.length >= 2) {
      result.push(part)
      break
    }
  }

  return result.join(' ')
}

export default function PlaceListSidebar() {
  const markers = useMapStore((s) => s.markers)
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const activeFilters = useMapStore((s) => s.activeFilters)
  const selectedPlace = useMapStore((s) => s.selectedPlace)
  const mapCenter = useMapStore((s) => s.mapCenter)
  const isLoading = useMapStore((s) => s.isLoading)
  const setSelectedPlace = useMapStore((s) => s.setSelectedPlace)
  const toggleFilter = useMapStore((s) => s.toggleFilter)

  const categoryLabel = getCategoryLabel(selectedCategory)

  const handleClickPlace = async (placeId: number) => {
    try {
      const detail = await getPlaceDetail(placeId)
      setSelectedPlace(detail)
    } catch {
      // 상세 조회 실패
    }
  }

  return (
    <div className="hidden w-[320px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:block">
      {selectedCategory === 'HOSPITAL' && (
        <div className="sticky top-0 z-10 flex gap-2 border-b border-gray-100 bg-white px-4 py-3">
          {HOSPITAL_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilters.includes(key)
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />
        </div>
      ) : markers.length === 0 ? (
        <div className="px-4 py-20 text-center">
          <p className="text-sm text-gray-400">
            현재 지도 영역에서
            <br />
            조건에 맞는 {categoryLabel}이(가) 없습니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {markers.map((place) => {
            const dist = getDistance(
              mapCenter.lat,
              mapCenter.lng,
              place.latitude,
              place.longitude
            )
            const tags: string[] = []
            if (place.detail?.is24Hours) tags.push('24시간 진료')
            if (place.detail?.isEmergencyAvailable) tags.push('응급 진료')
            place.detail?.animalTypes.forEach((type) => {
              tags.push(ANIMAL_TYPE_LABELS[type] ?? type)
            })

            const isSelected = selectedPlace?.id === place.id

            return (
              <li key={place.id}>
                <button
                  onClick={() => handleClickPlace(place.id)}
                  className={`flex w-full cursor-pointer gap-3 px-4 py-4 text-left transition-colors ${
                    isSelected
                      ? 'bg-orange-50 border-l-2 border-orange-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1">
                      <span className="text-[15px] font-bold text-gray-900">
                        {place.name}
                      </span>
                      <span className="mt-0.5 shrink-0 text-xs text-gray-400">
                        {categoryLabel}
                      </span>
                      {place.isRecommended && (
                        <span className="mt-0.5 ml-auto shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                          추천
                        </span>
                      )}
                    </div>

                    {tags.length > 0 && (
                      <p className="mt-1 text-sm text-gray-600">
                        {tags.join(' · ')}
                      </p>
                    )}

                    {place.reviewSummary && place.reviewSummary.averageRating > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <FiStar className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs text-gray-500">
                          {place.reviewSummary.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-300">
                          ({place.reviewSummary.reviewCount})
                        </span>
                      </div>
                    )}

                    <p className="mt-1 text-sm text-gray-400">
                      {formatDistance(dist)} · {shortenAddress(place.address)}
                    </p>
                  </div>

                  {place.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
