// 플레이스(반려동물 시설) 타입. 웹의 src/types/map.ts 와 **같은 모양**을 쓴다.
//
// ⚠️ 서버 DTO 를 직접 열어 맞춘 것이다(2026-08-05). 추측이 아니다.
//    PlaceListItemDto      · cmarket-domain/.../map/app/dto/PlaceListItemDto.java
//    PlaceDetailResponse   · cmarket/.../web/map/dto/PlaceDetailResponse.java
//
// 웹과 굳이 shared 로 합치지 않는다 — 웹은 지도 라이브러리가 달라 딸린 타입이 섞여 있고,
// 이 파일은 서버 응답만 담는다. 서버가 바뀌면 두 곳을 같이 고친다.

/** 서버 enum 값(대문자) 그대로 */
export type PlaceCategory = 'HOSPITAL' | 'CAFE' | 'RESTAURANT' | 'ACCOMMODATION';

export type AnimalType = 'REPTILE' | 'BIRD';

export interface ReviewSummary {
  reviewCount: number;
  averageRating: number;
}

/** 병원에만 붙는다. 다른 종류는 null 이다 */
export interface HospitalDetail {
  is24Hours: boolean;
  isEmergencyAvailable: boolean;
  animalTypes: AnimalType[];
}

export interface PlaceListItem {
  id: number;
  category: PlaceCategory;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isRecommended: boolean;
  imageUrl: string | null;
  reviewSummary: ReviewSummary | null;
  detail: HospitalDetail | null;
}

export interface PlaceDetail extends PlaceListItem {
  phone: string | null;
  operatingHours: string | null;
}

/** 지도에 지금 보이는 네 귀퉁이 */
export interface MapBounds {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

export interface PlaceListParams extends MapBounds {
  category: PlaceCategory;
  size?: number;
}

/** 서버가 목록을 감싸 주는 모양. 지금 화면은 items 만 쓴다 */
export interface PlaceListResponse {
  items: PlaceListItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** 화면에 보이는 이름. 웹 constants/map.ts 의 CATEGORIES 와 순서까지 같다 */
export const CATEGORIES: { key: PlaceCategory; label: string }[] = [
  { key: 'HOSPITAL', label: '동물병원' },
  { key: 'CAFE', label: '카페' },
  { key: 'RESTAURANT', label: '식당' },
  { key: 'ACCOMMODATION', label: '숙소' },
];

/** 웹과 같은 시작 자리 — 서울시청 */
export const DEFAULT_CENTER = { latitude: 37.5666, longitude: 126.9784 };
