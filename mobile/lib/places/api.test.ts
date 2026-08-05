import { getPlaceDetail, getPlaces } from './api';
import type { PlaceDetail, PlaceListItem } from './types';

jest.mock('../auth/api', () => ({
  apiFetch: jest.fn(),
}));

const { apiFetch } = jest.requireMock('../auth/api') as { apiFetch: jest.Mock };

function okJson(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function errJson(status: number) {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

beforeEach(() => {
  apiFetch.mockReset();
});

const bounds = {
  minLatitude: 37.1,
  maxLatitude: 37.9,
  minLongitude: 126.5,
  maxLongitude: 127.5,
};

const sampleItem: PlaceListItem = {
  id: 1,
  category: 'HOSPITAL',
  name: '멍멍 동물병원',
  address: '서울시 강남구',
  latitude: 37.5,
  longitude: 127.0,
  isRecommended: true,
  imageUrl: null,
  reviewSummary: { reviewCount: 3, averageRating: 4.5 },
  detail: { is24Hours: true, isEmergencyAvailable: false, animalTypes: [] },
};

describe('getPlaces', () => {
  it('category와 좌표 넷을 쿼리에 담는다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { items: [] } }));

    await getPlaces({ category: 'HOSPITAL', ...bounds });

    expect(apiFetch).toHaveBeenCalledWith(
      '/places?category=HOSPITAL&minLatitude=37.1&maxLatitude=37.9&minLongitude=126.5&maxLongitude=127.5'
    );
  });

  it('size를 안 주면 쿼리에 아예 없다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { items: [] } }));

    await getPlaces({ category: 'CAFE', ...bounds });

    const calledUrl = apiFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('size=');
  });

  it('size를 주면 쿼리 맨 뒤에 실린다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { items: [] } }));

    await getPlaces({ category: 'CAFE', ...bounds, size: 50 });

    expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('&size=50'));
  });

  it('data.items를 꺼내 돌려준다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: { items: [sampleItem], page: 0, total: 1 } }));

    const items = await getPlaces({ category: 'HOSPITAL', ...bounds });

    expect(items).toEqual([sampleItem]);
  });

  it('목록이 비면 빈 배열이다', async () => {
    apiFetch.mockResolvedValue(okJson({ data: {} }));

    const items = await getPlaces({ category: 'HOSPITAL', ...bounds });

    expect(items).toEqual([]);
  });

  it('서버 오류면 던진다', async () => {
    apiFetch.mockResolvedValue(errJson(500));

    await expect(getPlaces({ category: 'HOSPITAL', ...bounds })).rejects.toThrow(
      '장소 목록을 불러오지 못했어요'
    );
  });
});

describe('getPlaceDetail', () => {
  it('id로 부른다', async () => {
    const detail: PlaceDetail = {
      ...sampleItem,
      phone: '02-1234-5678',
      operatingHours: '09:00~18:00',
    };
    apiFetch.mockResolvedValue(okJson({ data: detail }));

    const result = await getPlaceDetail(7);

    expect(apiFetch).toHaveBeenCalledWith('/places/7');
    expect(result).toEqual(detail);
  });

  it('서버 오류면 던진다', async () => {
    apiFetch.mockResolvedValue(errJson(404));

    await expect(getPlaceDetail(7)).rejects.toThrow('장소 상세를 불러오지 못했어요');
  });
});
