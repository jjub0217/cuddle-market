import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Keyboard } from 'react-native';

import type { UploadSlot } from '@/lib/product-images';

import { PostImageField } from './post-image-field';

// 커뮤니티 글쓰기의 사진 칸.
//
// ⚠️ 상품 등록과 달리 **대표 지정이 없다.** 커뮤니티 글에는 대표 개념이 없고,
//    본문에 넣는 차례가 곧 순서다. 목록 썸네일은 서버가 본문 첫 사진에서 뽑는다.
//
// ⚠️ 사진첩을 여는 것·올리는 것은 여기서 못 덮는다(기기 일이다). 실기기로 봐야 한다.
//
// ⚠️ render·fireEvent 는 기다려야 한다(RNTL 14, mobile/AGENTS.md) — 안 그러면 조용히 옛 값을 준다.

// 사진첩을 여는 것만 가짜로 바꾼다. MAX_IMAGES 같은 값은 진짜를 그대로 쓴다 —
// 통째로 가짜로 만들면 최대 장수가 undefined 가 돼 더하기 자리가 사라진다.
jest.mock('@/lib/product-images', () => ({
  ...jest.requireActual('@/lib/product-images'),
  pickImages: jest.fn(),
}));

const { pickImages } = jest.requireMock('@/lib/product-images') as { pickImages: jest.Mock };

beforeEach(() => {
  pickImages.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

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

// 본문을 쓰다 사진을 고르면 키보드가 사진 칸을 덮는다(#923). 사진첩을 열기 전에 내린다.
it('사진을 고르러 갈 때 키보드를 내린다', async () => {
  const 내리기 = jest.spyOn(Keyboard, 'dismiss');
  pickImages.mockResolvedValue([]);

  await render(<PostImageField slots={[]} onChange={jest.fn()} />);
  await fireEvent.press(screen.getByTestId('post-image-add'));

  await waitFor(() => expect(pickImages).toHaveBeenCalled());
  expect(내리기).toHaveBeenCalled();
  // ⚠️ 사진첩이 **열리기 전**이어야 한다. 뒤에 내리면 이미 덮인 채로 사진첩이 뜬다.
  expect(내리기.mock.invocationCallOrder[0]).toBeLessThan(pickImages.mock.invocationCallOrder[0]);
});

it('다섯 장을 다 고르면 더하기 자리가 사라진다', async () => {
  const 다섯 = [0, 1, 2, 3, 4].map((i) => 칸({ key: `k${i}` }));
  await render(<PostImageField slots={다섯} onChange={jest.fn()} />);

  expect(screen.queryByTestId('post-image-add')).toBeNull();
});
