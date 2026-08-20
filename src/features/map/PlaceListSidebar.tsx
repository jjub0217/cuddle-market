'use client'

import { useMapStore } from '@/store/mapStore'
import { HOSPITAL_FILTERS } from '@/constants/map'
import { PlaceList } from './PlaceList'

// 데스크탑(md~)의 왼쪽 붙박이 목록.
//
// ⚠️ **줄 모양은 여기 없다.** `PlaceList` 가 갖고 있고, 모바일 전체 화면 목록도 같은 것을
//    쓴다(#976). 여기는 **자리와 스크롤만** 맡는다.
//
// ⚠️ **폭은 여기서 정하지 않는다.** 부모(MapContainer 의 왼쪽 열)가 `md:w-[320px]` 로
//    잡는다 — 두 곳에 적어 두면 한쪽만 고쳤을 때 어긋난다.
export default function PlaceListSidebar() {
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const activeFilters = useMapStore((s) => s.activeFilters)
  const toggleFilter = useMapStore((s) => s.toggleFilter)

  return (
    <div className="hidden min-h-0 flex-1 shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:block">
      {/* ⚠️ **「24시」·「응급」 알약을 감춰 두었다**(#969). 지우지 않고 감춘 것은
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

      <PlaceList />
    </div>
  )
}
