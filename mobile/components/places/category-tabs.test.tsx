import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CATEGORIES } from '@/lib/places/types';

import { CategoryTabs } from './category-tabs';

// ⚠️ render·fireEvent는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 조용히 틀린 게 통과한다.

const NOOP = () => {};

it('카테고리 넷이 CATEGORIES 순서 그대로 보인다', async () => {
  await render(<CategoryTabs selected="HOSPITAL" onSelect={NOOP} />);

  const labels = CATEGORIES.map((c) => c.label);
  expect(labels).toEqual(['동물병원', '카페', '식당', '숙소']);
  for (const label of labels) {
    expect(screen.getByText(label)).toBeTruthy();
  }
});

it('카테고리를 누르면 onSelect가 그 값으로 불린다', async () => {
  const onSelect = jest.fn();
  await render(<CategoryTabs selected="HOSPITAL" onSelect={onSelect} />);

  await fireEvent.press(screen.getByText('카페'));

  expect(onSelect).toHaveBeenCalledWith('CAFE');
});

it('고른 카테고리가 선택 상태로 표시된다', async () => {
  await render(<CategoryTabs selected="RESTAURANT" onSelect={NOOP} />);

  expect(screen.getByRole('button', { name: '식당', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '동물병원', selected: false })).toBeTruthy();
});
