import { render, screen } from '@testing-library/react-native';
import React from 'react';

import type { UploadSlot } from '@/lib/product-images';

import { PostImageField } from './post-image-field';

// 커뮤니티 글쓰기의 사진 칸.
//
// ⚠️ 상품 등록과 달리 **대표 지정이 없다.** 커뮤니티 글에는 대표 개념이 없고,
//    본문에 넣는 차례가 곧 순서다. 목록 썸네일은 서버가 본문 첫 사진에서 뽑는다.
//
// ⚠️ 사진첩을 여는 것·올리는 것은 여기서 못 덮는다(기기 일이다). 실기기로 봐야 한다.
//
// ⚠️ render 는 기다려야 한다(RNTL 14, mobile/AGENTS.md) — 안 그러면 조용히 옛 값을 준다.

function 칸(덮어쓰기: Partial<UploadSlot> = {}): UploadSlot {
  return {
    key: 'k1',
    localUri: 'file://a.jpg',
    url: 'https://cdn/a.webp',
    failed: false,
    ...덮어쓰기,
  };
}

it('고른 사진이 없으면 더하기 자리만 보인다', async () => {
  await render(<PostImageField slots={[]} onChange={jest.fn()} />);

  expect(screen.getByTestId('post-image-add')).toBeTruthy();
  expect(screen.queryByTestId('post-image-0')).toBeNull();
});

it('고른 사진을 그린다', async () => {
  await render(<PostImageField slots={[칸(), 칸({ key: 'k2' })]} onChange={jest.fn()} />);

  expect(screen.getByTestId('post-image-0')).toBeTruthy();
  expect(screen.getByTestId('post-image-1')).toBeTruthy();
});

it('몇 장 골랐는지 보여준다', async () => {
  await render(<PostImageField slots={[칸()]} onChange={jest.fn()} />);

  expect(screen.getByText('사진 (1/5)')).toBeTruthy();
});

// 상품 등록과 다른 점을 시험으로 못 박는다.
it('대표 지정은 없다', async () => {
  await render(<PostImageField slots={[칸()]} onChange={jest.fn()} />);

  expect(screen.queryByLabelText('대표 사진으로')).toBeNull();
  // 상품 등록 칸이 실제로 쓰는 이름(products/image-field.tsx)도 없어야 한다.
  expect(screen.queryByLabelText('대표 이미지로 지정')).toBeNull();
  expect(screen.queryByText('대표')).toBeNull();
});

it('다섯 장을 다 고르면 더하기 자리가 사라진다', async () => {
  const 다섯 = [0, 1, 2, 3, 4].map((i) => 칸({ key: `k${i}` }));
  await render(<PostImageField slots={다섯} onChange={jest.fn()} />);

  expect(screen.queryByTestId('post-image-add')).toBeNull();
});
