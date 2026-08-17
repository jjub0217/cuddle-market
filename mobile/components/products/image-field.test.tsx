import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Keyboard } from 'react-native';

import type { UploadSlot } from '@/lib/product-images';

import { ImageField } from './image-field';

// 상품 등록·수정의 사진 칸.
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

/** 커뮤니티 칸(post-image-field.tsx)과 달리 표식이 없어 이름으로 찾는다 */
const ADD = '이미지 등록';

function 칸(덮어쓰기: Partial<UploadSlot> = {}): UploadSlot {
  return {
    key: 'k1',
    localUri: 'file://a.jpg',
    url: 'https://cdn/a.webp',
    failed: false,
    ...덮어쓰기,
  };
}

beforeEach(() => {
  pickImages.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// 앞 칸(제목·가격)을 쓰다 사진을 고르면 키보드가 사진 칸을 덮는다(#923).
// 사진첩을 열기 전에 내린다 — region-field.tsx 가 같은 이유로 같이 한다.
it('사진을 고르러 갈 때 키보드를 내린다', async () => {
  const 내리기 = jest.spyOn(Keyboard, 'dismiss');
  pickImages.mockResolvedValue([]);

  await render(<ImageField slots={[]} onChange={jest.fn()} />);
  await fireEvent.press(screen.getByLabelText(ADD));

  await waitFor(() => expect(pickImages).toHaveBeenCalled());
  expect(내리기).toHaveBeenCalled();
  // ⚠️ 사진첩이 **열리기 전**이어야 한다. 뒤에 내리면 이미 덮인 채로 사진첩이 뜬다.
  expect(내리기.mock.invocationCallOrder[0]).toBeLessThan(pickImages.mock.invocationCallOrder[0]);
});

it('첫 장에 대표 표시를 붙인다', async () => {
  await render(<ImageField slots={[칸(), 칸({ key: 'k2' })]} onChange={jest.fn()} />);

  expect(screen.getByText('대표')).toBeTruthy();
  expect(screen.getAllByLabelText('대표 이미지로 지정')).toHaveLength(2);
});

it('다섯 장을 다 고르면 더하기 자리가 사라진다', async () => {
  const 다섯 = [0, 1, 2, 3, 4].map((i) => 칸({ key: `k${i}` }));
  await render(<ImageField slots={다섯} onChange={jest.fn()} />);

  expect(screen.queryByLabelText(ADD)).toBeNull();
});
