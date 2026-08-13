import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ImageCarousel } from './image-carousel';

// 상세 대표 사진에 확대창이 붙는다(#904).
//
// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md).

const IMAGES = ['https://cdn/a.webp', 'https://cdn/b.webp'];

it('처음에는 확대창이 닫혀 있다', async () => {
  await render(
    <ImageCarousel
      mainImageUrl={IMAGES[0]}
      subImageUrls={[IMAGES[1]]}
      tradeStatus={null}
      productType="판매상품"
    />
  );

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
  );

  await fireEvent.press(screen.getByTestId('detail-photo-0'));

  expect(screen.getByLabelText('닫기')).toBeTruthy();
});
