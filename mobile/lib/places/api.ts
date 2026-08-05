import { apiFetch } from '../auth/api';
import type { PlaceDetail, PlaceListItem, PlaceListParams } from './types';

// 플레이스(반려동물 시설) 서버 호출을 한 곳에 모은다.
// 서버 주소는 웹 src/lib/api/places.ts 와 같다: GET /places, GET /places/{id}
//
// ⚠️ 목록 응답은 { data: PlaceListResponse } 로 감싸여 오고, PlaceListResponse 안에
//    items·page·total 등이 들어 있다(types.ts). 이 화면은 items만 쓰므로 여기서
//    벗겨서 PlaceListItem[]만 돌려준다 — 화면에서 매번 data.items로 파고들지 않게.

export async function getPlaces(params: PlaceListParams): Promise<PlaceListItem[]> {
  // 숫자 좌표는 쿼리 문자열에 넣으면 자동으로 문자열이 된다. size는 있을 때만 붙인다.
  const query =
    `category=${params.category}` +
    `&minLatitude=${params.minLatitude}` +
    `&maxLatitude=${params.maxLatitude}` +
    `&minLongitude=${params.minLongitude}` +
    `&maxLongitude=${params.maxLongitude}` +
    (params.size != null ? `&size=${params.size}` : '');

  const res = await apiFetch(`/places?${query}`);
  if (!res.ok) throw new Error(`장소 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { items?: PlaceListItem[] } };
  return body.data?.items ?? [];
}

export async function getPlaceDetail(placeId: number): Promise<PlaceDetail> {
  const res = await apiFetch(`/places/${placeId}`);
  if (!res.ok) throw new Error(`장소 상세를 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data: PlaceDetail };
  return body.data;
}
