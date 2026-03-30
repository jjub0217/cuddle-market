import type { Metadata } from 'next'
import MapContainer from '@/features/map/MapContainer'

export const metadata: Metadata = {
  title: '지도 | 커들마켓',
  description: '내 주변 동물병원, 카페, 식당, 숙소를 지도에서 찾아보세요.',
}

export default function MapPage() {
  return <MapContainer />
}
