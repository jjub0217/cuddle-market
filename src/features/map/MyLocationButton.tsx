'use client'

import { useMapStore } from '@/store/mapStore'
import { FiCrosshair } from 'react-icons/fi'

export default function MyLocationButton() {
  const setMapCenter = useMapStore((s) => s.setMapCenter)

  const handleClick = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setMapCenter({ lat: latitude, lng: longitude })

        const mapEl = document.querySelector('[data-naver-map]')
        if (mapEl) {
          const event = new CustomEvent('moveToCenter', {
            detail: { lat: latitude, lng: longitude },
          })
          mapEl.dispatchEvent(event)
        }
      },
      () => {
        alert('위치 정보를 가져올 수 없습니다.')
      },
      { timeout: 5000 }
    )
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-6 right-4 z-10 cursor-pointer rounded-full bg-white p-3 shadow-md transition-colors hover:bg-gray-50"
      title="내 위치"
    >
      <FiCrosshair className="h-5 w-5 text-gray-700" />
    </button>
  )
}
