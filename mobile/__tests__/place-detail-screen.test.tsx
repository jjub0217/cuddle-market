import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PlaceDetailScreen from '@/app/(tabs)/(place)/places/[id]';
import type { PlaceDetail } from '@/lib/places/types';

// 장소 상세 **화면**의 시험. 여기서 지키는 것은 **사진 자리**다 —
// 이 화면의 장소는 정부 공개 API 에서 와서 사진이 거의 없는데(상세 API 를 다섯 곳 찍어 전부 null),
// 자리가 화면 폭만 한 정사각이라 비우면 큰 회색 네모만 남는다. 기본 그림으로 메운다(#986).
//
// ⚠️ 목록(place-list-item.tsx)은 반대로 자리를 아예 없앤다(#978). 크기와 반복 횟수가 달라서다.
//
// ⚠️ **왜 app/ 안에 안 두고 여기 두나** — expo-router 는 app/ 의 모든 파일을 화면으로 본다.
//    시험 파일을 거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * 훅이 돌려줄 값. 시험마다 갈아 끼운다.
 *
 * ⚠️ 이름이 **`mock` 으로 시작해야 한다.** 아니면 babel-plugin-jest-hoist 가
 *    `jest.mock` 안에서 밖의 변수를 못 읽게 막아 파일이 아예 안 돈다(mobile/AGENTS.md).
 */
const mock상세: { place: PlaceDetail | null; loading: boolean; error: string | null } = {
  place: null,
  loading: false,
  error: null,
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/lib/places/use-place-detail', () => ({
  usePlaceDetail: () => mock상세,
}));

const 병원: PlaceDetail = {
  id: 1,
  category: 'HOSPITAL',
  name: '멍냥 동물병원',
  address: '서울시 강남구 역삼동 123',
  latitude: 37.5,
  longitude: 127.0,
  isRecommended: false,
  imageUrl: null,
  reviewSummary: { reviewCount: 0, averageRating: 0 },
  detail: { is24Hours: false, isEmergencyAvailable: false, animalTypes: [] },
  phone: null,
  operatingHours: null,
};

function 화면을그린다() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PlaceDetailScreen />
    </SafeAreaProvider>
  );
}

/**
 * 사진 자리가 무엇을 그리고 있나.
 *
 * ⚠️ expo-image 는 `source` 를 **배열로 정규화한다.** 넘긴 그대로 있지 않다 —
 *    인터넷 사진은 `[{ uri }]`, 파일로 넣은 그림은 `[{ testUri }]` 가 된다.
 *    그냥 `props.source.uri` 를 보면 **둘 다 undefined 라 시험이 거짓으로 통과한다.**
 */
function 사진자리() {
  const [첫장] = screen.getByTestId('place-detail-image').props.source as {
    uri?: string;
    testUri?: string;
  }[];
  return 첫장;
}

beforeEach(() => {
  mock상세.place = 병원;
  mock상세.loading = false;
  mock상세.error = null;
});

it('사진이 없으면 기본 그림을 그린다', async () => {
  await 화면을그린다();

  // 「아무것도 안 그림」과 구분되게 파일 이름까지 본다.
  expect(사진자리().testUri).toContain('place-placeholder');
  expect(사진자리().uri).toBeUndefined();
});

it('사진이 있으면 그 사진을 그린다', async () => {
  mock상세.place = { ...병원, imageUrl: 'https://cdn.example/1.webp' };
  await 화면을그린다();

  expect(사진자리().uri).toBe('https://cdn.example/1.webp');
});

it('사진을 못 받아 오면 기본 그림으로 바꾼다', async () => {
  mock상세.place = { ...병원, imageUrl: 'https://cdn.example/깨진.webp' };
  await 화면을그린다();

  // ⚠️ expo-image 의 onError 는 event.nativeEvent 를 꺼내 쓴다(ExpoImage.tsx).
  //    빈 손으로 쏘면 시험이 죽는다.
  await fireEvent(screen.getByTestId('place-detail-image'), 'error', {
    nativeEvent: { error: '못 받았다' },
  });

  expect(사진자리().testUri).toContain('place-placeholder');
});
