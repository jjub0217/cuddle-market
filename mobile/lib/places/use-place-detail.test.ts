// getPlaceDetail만 가짜로 바꾼다.
jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  getPlaceDetail: jest.fn(),
}));

import { renderHook, waitFor } from '@testing-library/react-native';

import * as api from './api';
import { usePlaceDetail } from './use-place-detail';
import type { PlaceDetail } from './types';

const mockedApi = api as jest.Mocked<typeof api>;

const sampleDetail: PlaceDetail = {
  id: 7,
  category: 'HOSPITAL',
  name: '멍멍 동물병원',
  address: '서울시 강남구',
  latitude: 37.5,
  longitude: 127.0,
  isRecommended: true,
  imageUrl: null,
  reviewSummary: { reviewCount: 3, averageRating: 4.5 },
  detail: { is24Hours: true, isEmergencyAvailable: false, animalTypes: [] },
  phone: '02-1234-5678',
  operatingHours: '09:00~18:00',
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('처음엔 loading이 true다', async () => {
  mockedApi.getPlaceDetail.mockReturnValue(new Promise(() => {})); // 안 끝나는 약속
  const { result } = await renderHook(() => usePlaceDetail(7));

  expect(result.current.loading).toBe(true);
  expect(result.current.place).toBeNull();
});

it('부르면 그 id로 서버를 부른다', async () => {
  mockedApi.getPlaceDetail.mockResolvedValue(sampleDetail);
  await renderHook(() => usePlaceDetail(7));

  await waitFor(() => expect(mockedApi.getPlaceDetail).toHaveBeenCalledWith(7));
});

it('placeId가 바뀌면 새 id로 다시 부른다', async () => {
  mockedApi.getPlaceDetail.mockResolvedValue(sampleDetail);
  const { rerender } = await renderHook(({ id }: { id: number }) => usePlaceDetail(id), {
    initialProps: { id: 7 },
  });

  await waitFor(() => expect(mockedApi.getPlaceDetail).toHaveBeenCalledWith(7));

  await rerender({ id: 9 });

  await waitFor(() => expect(mockedApi.getPlaceDetail).toHaveBeenCalledWith(9));
});

it('성공하면 place가 채워지고 loading이 false다', async () => {
  mockedApi.getPlaceDetail.mockResolvedValue(sampleDetail);
  const { result } = await renderHook(() => usePlaceDetail(7));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.place).toEqual(sampleDetail);
  expect(result.current.error).toBeNull();
});

it('실패하면 error에 사람이 읽을 문구가 담기고 place는 null이다', async () => {
  mockedApi.getPlaceDetail.mockRejectedValue(new Error('HTTP 500'));
  const { result } = await renderHook(() => usePlaceDetail(7));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.place).toBeNull();
  expect(result.current.error).toBe('장소 정보를 불러오지 못했어요.');
});

it('성공했다가 실패하면 이전 place를 지운다', async () => {
  mockedApi.getPlaceDetail.mockResolvedValueOnce(sampleDetail);
  const { result, rerender } = await renderHook(({ id }: { id: number }) => usePlaceDetail(id), {
    initialProps: { id: 7 },
  });
  await waitFor(() => expect(result.current.place).toEqual(sampleDetail));

  mockedApi.getPlaceDetail.mockRejectedValueOnce(new Error('HTTP 404'));
  await rerender({ id: 8 });

  await waitFor(() => expect(result.current.error).toBe('장소 정보를 불러오지 못했어요.'));
  expect(result.current.place).toBeNull();
});
