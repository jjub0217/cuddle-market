import axios from 'axios'
import type {
  ApiResponse,
  PlaceListResponse,
  PlaceDetail,
  PlaceListParams,
} from '@/types/map'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

export async function getPlaces(
  params: PlaceListParams
): Promise<PlaceListResponse> {
  const queryParams: Record<string, string> = {
    category: params.category,
    minLatitude: String(params.minLatitude),
    maxLatitude: String(params.maxLatitude),
    minLongitude: String(params.minLongitude),
    maxLongitude: String(params.maxLongitude),
  }

  if (params.isRecommended != null)
    queryParams.isRecommended = String(params.isRecommended)
  if (params.is24Hours != null) queryParams.is24Hours = String(params.is24Hours)
  if (params.isEmergencyAvailable != null)
    queryParams.isEmergencyAvailable = String(params.isEmergencyAvailable)
  if (params.animalTypes?.length)
    queryParams.animalTypes = params.animalTypes.join(',')
  if (params.size != null) queryParams.size = String(params.size)

  const { data } = await api.get<ApiResponse<PlaceListResponse>>('/places', {
    params: queryParams,
  })
  return data.data
}

export async function getPlaceDetail(placeId: number): Promise<PlaceDetail> {
  const { data } = await api.get<ApiResponse<PlaceDetail>>(
    `/places/${placeId}`
  )
  return data.data
}
