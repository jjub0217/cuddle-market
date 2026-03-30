import type { PlaceCategory, HospitalFilter } from '@/types/map'

export const DEFAULT_CENTER = { lat: 37.5666, lng: 126.9784 } // 서울 시청

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

export const ANIMAL_TYPE_LABELS: Record<string, string> = {
  REPTILE: '파충류',
  BIRD: '조류',
}
