'use client'

import { useMapStore } from '@/store/mapStore'
import { CATEGORIES, HOSPITAL_FILTERS } from '@/constants/map'
// import { ANIMAL_TYPE_LABELS } from '@/constants/map'  // TODO: 특수동물 진료 데이터 추가 시 활성화
import { getPlaceDetail } from '@/lib/api/places'
import { FiStar } from 'react-icons/fi'
import Spinner from '@/components/commons/spinner/Spinner'

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
    if (/(특별시|광역시|특별자치시|특별자치도|특별자치시|시)$/.test(part)) {
      result.push(part.replace(/(특별자치도|특별자치시|특별시|광역시|시)$/, ''))
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
    <div className="hidden min-h-0 w-[320px] flex-1 shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:block">
      {/* ⚠️ **「24시」·「응급」 알약을 감춰 두었다**(#969 후속). 지우지 않고 감춘 것은
          **나중에 다시 쓸 수 있어서**다.

          왜 감추나: 이 화면의 장소는 **정부 공개 API** 에서 온다. 거기에는 24시·응급으로
          거르는 조건이 없다. 그런데 이 알약은 그 값을 **서버 쿼리로 보낸다** —
          `mapStore.ts` 의 `getFilterParams` 가 `is24Hours=true` 를 실어 보낸다.
          받는 쪽이 못 거르니 눌러도 목록이 그대로이거나 빈 결과가 된다.

          ⚠️ 상세 화면의 「24시간」·「응급진료」 **뱃지는 그대로 둔다.** 그것은 거르는 게
             아니라 그 병원이 어떤 곳인지 알려 주는 것이라 값이 있으면 보여야 한다.

          되살릴 때: 아래 `false &&` 만 지우면 된다. 그전에 API 가 그 조건을 지원하는지
          먼저 확인할 것. */}
      {false && selectedCategory === 'HOSPITAL' && (
        <div className="sticky top-0 z-10 flex gap-2 border-b border-gray-100 bg-white px-4 py-3">
          {HOSPITAL_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilters.includes(key)
                  ? 'bg-primary-container text-on-primary-container'
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
          <Spinner size="sm" />
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
            // TODO: 특수동물 진료 데이터 추가 시 활성화
            // place.detail?.animalTypes.forEach((type) => {
            //   tags.push(ANIMAL_TYPE_LABELS[type] ?? type)
            // })

            const isSelected = selectedPlace?.id === place.id

            return (
              <li key={place.id}>
                <button
                  onClick={() => handleClickPlace(place.id)}
                  className={`flex w-full cursor-pointer gap-3 px-4 py-4 text-left transition-colors ${
                    isSelected
                      ? 'bg-surface-container-low border-l-2 border-primary-container'
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
                        <span className="bg-badge-yellow-container text-badge-yellow mt-0.5 ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs">
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
