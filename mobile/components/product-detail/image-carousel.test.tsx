import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ImageCarousel } from './image-carousel';

// 상세 대표 사진에 확대창이 붙는다(#904).
//
// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md).

const IMAGES = ['https://cdn/a.webp', 'https://cdn/b.webp'];


// 안전영역(기기 바) 값을 쓰는 조각이라 감싸 줘야 한다 — bottom-sheet.test.tsx 와 같은 방식.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

it('처음에는 확대창이 닫혀 있다', async () => {
  await render(
    <ImageCarousel
      mainImageUrl={IMAGES[0]}
      subImageUrls={[IMAGES[1]]}
      tradeStatus={null}
      productType="판매상품"
    />
  , { wrapper: Wrapper });

  expect(screen.queryByLabelText('닫기')).toBeNull();
});

it('사진을 누르면 확대창이 열린다', async () => {
  await render(
    <ImageCarousel
      mainImageUrl={IMAGES[0]}
      subImageUrls={[IMAGES[1]]}
      tradeStatus={null}
      productType="판매상품"
    />
  , { wrapper: Wrapper });

  await fireEvent.press(screen.getByTestId('detail-photo-0'));

  expect(screen.getByLabelText('닫기')).toBeTruthy();
});

// 사진은 필수가 아니다. 한 장도 없으면 빈 회색 칸 대신 기본 그림을 보여 준다(#1120).
it('사진이 한 장도 없으면 기본 그림을 보여 준다', async () => {
  await render(
    <ImageCarousel mainImageUrl="" subImageUrls={[]} tradeStatus={null} productType="판매상품" />
  , { wrapper: Wrapper });

  expect(screen.getByTestId('detail-photo-placeholder')).toBeTruthy();
  expect(screen.queryByTestId('detail-photo-0')).toBeNull();
});

it('사진이 있으면 기본 그림을 안 그린다', async () => {
  await render(
    <ImageCarousel mainImageUrl={IMAGES[0]} subImageUrls={[]} tradeStatus={null} productType="판매상품" />
  , { wrapper: Wrapper });

  expect(screen.queryByTestId('detail-photo-placeholder')).toBeNull();
});
