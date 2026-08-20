'use client'

import { CATEGORIES } from '@/constants/map'
import { useMapStore } from '@/store/mapStore'

export default function CategoryTabs() {
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const setSelectedCategory = useMapStore((s) => s.setSelectedCategory)

  // ⚠️ 알약 안쪽 좌우는 **12px** 이다(px-3). **앱과 같은 값**이어야 한다 —
  //    mobile/components/places/category-tabs.tsx 의 chip.paddingHorizontal.
  //    줄 바깥 여백(px-4 = 16)은 그대로 둔다. 그건 화면 가장자리와의 간격이라 다른 질문이다.
  return (
    <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-white px-4 py-3">
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setSelectedCategory(key)}
          className={`shrink-0 cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition-colors ${
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
