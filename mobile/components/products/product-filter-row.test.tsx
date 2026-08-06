import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';

import { CATEGORY_OPTIONS, PET_TYPE_OPTIONS } from '@cuddle/shared';

import { ProductFilterRow } from './product-filter-row';

// ⚠️ render·fireEvent는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 조용히 틀린 게 통과한다.

function renderRow(overrides: Partial<Parameters<typeof ProductFilterRow>[0]> = {}) {
  const onChangePetType = jest.fn();
  const onChangeCategory = jest.fn();
  const props = {
    petType: null,
    category: null,
    onChangePetType,
    onChangeCategory,
    ...overrides,
  };
  return { onChangePetType, onChangeCategory, props };
}

it('두 줄이 다 보인다 (대분류 하나, 카테고리 하나)', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByText(PET_TYPE_OPTIONS[0].label)).toBeTruthy();
  expect(screen.getByText(CATEGORY_OPTIONS[0].label)).toBeTruthy();
});

it('전체가 각 줄 맨 앞에 있다', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  // 렌더 순서: [전체, 대분류 9개, 전체, 카테고리 8개] — 줄 둘이 이어서 그려진다
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(2 + PET_TYPE_OPTIONS.length + CATEGORY_OPTIONS.length);
  expect(within(buttons[0]).getByText('전체')).toBeTruthy();
  expect(within(buttons[PET_TYPE_OPTIONS.length + 1]).getByText('전체')).toBeTruthy();
});

it('대분류 알약을 누르면 onChangePetType이 그 코드로 불린다', async () => {
  const { props, onChangePetType } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(PET_TYPE_OPTIONS[0].label));

  expect(onChangePetType).toHaveBeenCalledWith(PET_TYPE_OPTIONS[0].code);
});

it('카테고리 알약을 누르면 onChangeCategory가 그 코드로 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(CATEGORY_OPTIONS[0].label));

  expect(onChangeCategory).toHaveBeenCalledWith(CATEGORY_OPTIONS[0].code);
});

it('고른 대분류를 다시 누르면 null로 알린다', async () => {
  const { props, onChangePetType } = renderRow({ petType: PET_TYPE_OPTIONS[0].code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(PET_TYPE_OPTIONS[0].label));

  expect(onChangePetType).toHaveBeenCalledWith(null);
});

it('고른 것이 선택 상태로 표시된다', async () => {
  const { props } = renderRow({ petType: PET_TYPE_OPTIONS[0].code });
  await render(<ProductFilterRow {...props} />);

  expect(
    screen.getByRole('button', { name: PET_TYPE_OPTIONS[0].label, selected: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: PET_TYPE_OPTIONS[1].label, selected: false }),
  ).toBeTruthy();
});

it('대분류를 눌러도 카테고리 쪽 콜백은 안 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(PET_TYPE_OPTIONS[0].label));

  expect(onChangeCategory).not.toHaveBeenCalled();
});
