import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { PlaceListItem as PlaceListItemType } from '@/lib/places/types';

import { PlaceListItem, THUMB_IMAGE_TEST_ID, THUMB_TEST_ID } from './place-list-item';

// ⚠️ @testing-library/react-native 14의 render·fireEvent는 기다려야 한다.
//    안 기다리면 fireEvent는 오류 없이 옛 값을 준다 — 조용히 틀린 것을 통과시킨다(mobile/AGENTS.md).

const NOOP = () => {};

// 병원 + 24시. detail이 있는 유일한 카테고리라 24시 표시 시험의 기준으로 쓴다.
const HOSPITAL_24H: PlaceListItemType = {
  id: 1,
  category: 'HOSPITAL',
  name: '멍냥 24시 동물병원',
  address: '서울시 강남구 역삼동 123',
  latitude: 37.5,
  longitude: 127.0,
  isRecommended: false,
  imageUrl: null,
  reviewSummary: { reviewCount: 12, averageRating: 4.5 },
  detail: { is24Hours: true, isEmergencyAvailable: true, animalTypes: [] },
};

it('이름과 주소가 보인다', async () => {
  await render(<PlaceListItem place={HOSPITAL_24H} onPress={NOOP} />);

  expect(screen.getByText('멍냥 24시 동물병원')).toBeTruthy();
  expect(screen.getByText('서울시 강남구 역삼동 123')).toBeTruthy();
});

it('후기 요약이 있으면 별점과 후기 수가 보인다', async () => {
  await render(<PlaceListItem place={HOSPITAL_24H} onPress={NOOP} />);

  expect(screen.getByText('4.5 (12)')).toBeTruthy();
});

it('후기 요약이 null이면 별점이 안 보인다', async () => {
  const place: PlaceListItemType = { ...HOSPITAL_24H, reviewSummary: null };
  await render(<PlaceListItem place={place} onPress={NOOP} />);

  expect(screen.queryByText(/\(\d+\)/)).toBeNull();
});

// #982 — 서버는 후기가 없어도 reviewSummary 를 null 이 아니라 0 으로 채워 보낸다.
// 이것을 못 거르면 목록 전체에 뜻 없는 「0.0」이 뜬다(운영 실측: 서울 병원 100곳이 전부 0).
it('후기가 0개면 별점이 안 보인다', async () => {
  const place: PlaceListItemType = {
    ...HOSPITAL_24H,
    reviewSummary: { reviewCount: 0, averageRating: 0 },
  };
  await render(<PlaceListItem place={place} onPress={NOOP} />);

  expect(screen.queryByText('0.0 (0)')).toBeNull();
});

it('24시 병원이면 「24시」 표시가 보인다', async () => {
  await render(<PlaceListItem place={HOSPITAL_24H} onPress={NOOP} />);

  expect(screen.getByText('24시')).toBeTruthy();
});

it('24시가 아닌 병원이면 「24시」 표시가 안 보인다', async () => {
  const place: PlaceListItemType = {
    ...HOSPITAL_24H,
    detail: { is24Hours: false, isEmergencyAvailable: false, animalTypes: [] },
  };
  await render(<PlaceListItem place={place} onPress={NOOP} />);

  expect(screen.queryByText('24시')).toBeNull();
});

it('병원이 아니면(detail이 null) 「24시」 표시가 안 보인다', async () => {
  const place: PlaceListItemType = {
    ...HOSPITAL_24H,
    category: 'CAFE',
    detail: null,
  };
  await render(<PlaceListItem place={place} onPress={NOOP} />);

  expect(screen.queryByText('24시')).toBeNull();
});

// #978 — 사진이 없으면 회색 빈 상자를 남기지 않는다. 이 화면의 장소는 정부 공개 API 에서
// 와서 사진이 거의 없어(22줄 중 0줄), 자리를 남기면 뜻 없는 네모만 늘어선다.
it('사진이 없으면 사진 자리가 아예 안 그려진다', async () => {
  await render(<PlaceListItem place={HOSPITAL_24H} onPress={NOOP} />);

  expect(screen.queryByTestId(THUMB_TEST_ID)).toBeNull();
});

it('사진이 있으면 사진 자리가 그려진다', async () => {
  const place: PlaceListItemType = { ...HOSPITAL_24H, imageUrl: 'https://cdn.example/1.webp' };
  await render(<PlaceListItem place={place} onPress={NOOP} />);

  expect(screen.getByTestId(THUMB_TEST_ID)).toBeTruthy();
});

it('사진 로드에 실패하면 자리가 사라진다', async () => {
  const place: PlaceListItemType = { ...HOSPITAL_24H, imageUrl: 'https://cdn.example/깨진.webp' };
  await render(<PlaceListItem place={place} onPress={NOOP} />);

  // ⚠️ expo-image 의 onError 는 event.nativeEvent 를 꺼내 쓴다(ExpoImage.tsx 의
  //    withDeprecatedNativeEvent). 빈 손으로 쏘면 시험이 «Cannot convert undefined...» 로 죽는다.
  await fireEvent(screen.getByTestId(THUMB_IMAGE_TEST_ID), 'error', {
    nativeEvent: { error: '못 받았다' },
  });

  expect(screen.queryByTestId(THUMB_TEST_ID)).toBeNull();
});

it('누르면 onPress가 그 장소의 id로 불린다', async () => {
  const onPress = jest.fn();
  await render(<PlaceListItem place={HOSPITAL_24H} onPress={onPress} />);

  await fireEvent.press(screen.getByText('멍냥 24시 동물병원'));

  expect(onPress).toHaveBeenCalledWith(1);
});
