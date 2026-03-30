// API Enum 값 (대문자)
export type PlaceCategory = 'HOSPITAL' | 'CAFE' | 'RESTAURANT' | 'ACCOMMODATION'
export type AnimalType = 'REPTILE' | 'BIRD'
export type HospitalFilter = 'is24Hours' | 'isEmergencyAvailable' | 'REPTILE' | 'BIRD'

export interface ReviewSummary {
  reviewCount: number
  averageRating: number
}

export interface HospitalDetail {
  is24Hours: boolean
  isEmergencyAvailable: boolean
  animalTypes: AnimalType[]
}

export interface PlaceListItem {
  id: number
  category: PlaceCategory
  name: string
  address: string
  latitude: number
  longitude: number
  isRecommended: boolean
  imageUrl: string | null
  reviewSummary: ReviewSummary | null
  detail: HospitalDetail | null
}

export interface PlaceDetail {
  id: number
  category: PlaceCategory
  name: string
  address: string
  phone: string | null
  operatingHours: string | null
  imageUrl: string | null
  latitude: number
  longitude: number
  isRecommended: boolean
  reviewSummary: ReviewSummary | null
  detail: HospitalDetail | null
}

export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface PlaceListResponse {
  page: number
  size: number
  total: number
  items: PlaceListItem[]
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  totalElements: number
  numberOfElements: number
}

export interface MapBounds {
  minLatitude: number
  maxLatitude: number
  minLongitude: number
  maxLongitude: number
}

export interface PlaceListParams {
  category: PlaceCategory
  minLatitude: number
  maxLatitude: number
  minLongitude: number
  maxLongitude: number
  isRecommended?: boolean
  is24Hours?: boolean
  isEmergencyAvailable?: boolean
  animalTypes?: AnimalType[]
  size?: number
}
