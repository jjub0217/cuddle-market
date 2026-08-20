'use client'

import { useMapStore } from '@/store/mapStore'
import { CATEGORIES } from '@/constants/map'
// import { ANIMAL_TYPE_LABELS } from '@/constants/map'  // TODO: 특수동물 진료 데이터 추가 시 활성화
import { getPlaceDetail } from '@/lib/api/places'
import { FiStar } from 'react-icons/fi'
import Spinner from '@/components/commons/spinner/Spinner'

// 장소 목록의 **알맹이** — 로딩·빈 화면·줄들.
//
// ⚠️ **두 곳이 이것을 함께 쓴다.** 줄 모양을 두 벌로 만들면 한쪽만 고쳐져 갈린다.
//
//   PlaceListSidebar          데스크탑 왼쪽 붙박이 목록 (md~)
//   MobilePlaceListOverlay    모바일 전체 화면 목록 (「목록 보기」 로 연다, #976)
//
// 담는 껍데기만 다르고 줄은 같다.

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

interface PlaceListProps {
  /** 한 줄을 누른 뒤 할 일. 모바일은 여기서 목록을 닫는다 */
  onSelect?: () => void
}

export function PlaceList({ onSelect }: PlaceListProps) {
  const markers = useMapStore((s) => s.markers)
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const selectedPlace = useMapStore((s) => s.selectedPlace)
  const mapCenter = useMapStore((s) => s.mapCenter)
  const isLoading = useMapStore((s) => s.isLoading)
  const setSelectedPlace = useMapStore((s) => s.setSelectedPlace)

  const categoryLabel = getCategoryLabel(selectedCategory)

  const handleClickPlace = async (placeId: number) => {
    try {
      const detail = await getPlaceDetail(placeId)
      setSelectedPlace(detail)
      onSelect?.()
    } catch {
      // 상세 조회 실패
    }
  }

  return isLoading ? (
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
  )
}
