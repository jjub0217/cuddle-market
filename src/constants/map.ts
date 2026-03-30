import type { PlaceCategory, HospitalFilter } from '@/types/map'

export const DEFAULT_CENTER = { lat: 37.5666, lng: 126.9784 } // 서울 시청
export const DEFAULT_RADIUS = 3 // km

export const CATEGORIES: { key: PlaceCategory; label: string }[] = [
  { key: 'HOSPITAL', label: '동물병원' },
  { key: 'CAFE', label: '카페' },
  { key: 'RESTAURANT', label: '식당' },
  { key: 'ACCOMMODATION', label: '숙소' },
]

export const HOSPITAL_FILTERS: { key: HospitalFilter; label: string }[] = [
  { key: 'is24Hours', label: '24시' },
  { key: 'isEmergencyAvailable', label: '응급' },
]

// 줌 레벨 → 반경 매핑
export const ZOOM_RADIUS_MAP: Record<number, number> = {
  18: 0.5,
  17: 1,
  16: 1,
  15: 3,
  14: 3,
  13: 5,
  12: 10,
  11: 15,
  10: 20,
}

export const ANIMAL_TYPE_LABELS: Record<string, string> = {
  REPTILE: '파충류',
  BIRD: '조류',
}
