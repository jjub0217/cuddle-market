import { fireEvent, render, screen, within } from '@testing-library/react-native';
import React from 'react';

import { CATEGORY_OPTIONS, PET_DETAIL_OPTIONS_BY_TYPE, PET_TYPE_OPTIONS } from '@cuddle/shared';

import { ProductFilterRow } from './product-filter-row';

// ⚠️ render·rerender·fireEvent는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 조용히 틀린 게 통과한다.

const FIRST_PET = PET_TYPE_OPTIONS[0]; // 포유류
const SECOND_PET = PET_TYPE_OPTIONS[1]; // 조류
const FIRST_DETAIL = PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code][0]; // 강아지

function renderRow(overrides: Partial<Parameters<typeof ProductFilterRow>[0]> = {}) {
  const onChangePetType = jest.fn();
  const onChangePetDetailType = jest.fn();
  const onChangeCategory = jest.fn();
  const props = {
    petType: null,
    petDetailType: null,
    category: null,
    onChangePetType,
    onChangePetDetailType,
    onChangeCategory,
    ...overrides,
  };
  return { onChangePetType, onChangePetDetailType, onChangeCategory, props };
}

it('두 줄이 다 보인다 (대분류 하나, 카테고리 하나)', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByText(FIRST_PET.label)).toBeTruthy();
  expect(screen.getByText(CATEGORY_OPTIONS[0].label)).toBeTruthy();
});

it('「전체」는 대분류 줄에만 있고 카테고리 줄에는 없다', async () => {
  // 카테고리는 그림 줄이라 「전체」 그림을 지어내지 않는다. 아무것도 안 고른 상태가 전체이고,
  // 되돌릴 때는 고른 것을 다시 누른다 — 웹 CategoryFilter.tsx 와 같다.
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  // 렌더 순서: [전체, 대분류 9개, 카테고리 8개] — 줄 둘이 이어서 그려진다
  // (대분류가 「전체」라 소분류 줄은 없다)
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(1 + PET_TYPE_OPTIONS.length + CATEGORY_OPTIONS.length);
  expect(within(buttons[0]).getByText('전체')).toBeTruthy();
  // 「전체」는 화면을 통틀어 하나뿐이다
  expect(screen.getAllByText('전체')).toHaveLength(1);
});

it('대분류 알약을 누르면 onChangePetType이 그 코드로 불린다', async () => {
  const { props, onChangePetType } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(FIRST_PET.label));

  expect(onChangePetType).toHaveBeenCalledWith(FIRST_PET.code);
});

it('카테고리를 누르면 onChangeCategory가 그 코드로 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(CATEGORY_OPTIONS[0].label));

  expect(onChangeCategory).toHaveBeenCalledWith(CATEGORY_OPTIONS[0].code);
});

it('고른 대분류를 다시 누르면 null로 알린다', async () => {
  const { props, onChangePetType } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(FIRST_PET.label));

  expect(onChangePetType).toHaveBeenCalledWith(null);
});

it('고른 것이 선택 상태로 표시된다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByRole('button', { name: FIRST_PET.label, selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: SECOND_PET.label, selected: false })).toBeTruthy();
});

it('대분류를 눌러도 카테고리 쪽 콜백은 안 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(FIRST_PET.label));

  expect(onChangeCategory).not.toHaveBeenCalled();
});

// ── 소분류 줄 (Task 2) ──────────────────────────────────────────────

it('대분류가 「전체」면 소분류 줄이 아예 없다', async () => {
  const { props } = renderRow({ petType: null });
  await render(<ProductFilterRow {...props} />);

  // 어느 대분류의 세부든 하나도 안 보여야 한다
  for (const options of Object.values(PET_DETAIL_OPTIONS_BY_TYPE)) {
    for (const option of options) {
      expect(screen.queryByText(option.label)).toBeNull();
    }
  }
});

it('대분류를 고르면 그 대분류의 소분류만 나온다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  for (const option of PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code]) {
    expect(screen.getByText(option.label)).toBeTruthy();
  }
  // 다른 대분류(조류)의 세부는 안 나온다
  for (const option of PET_DETAIL_OPTIONS_BY_TYPE[SECOND_PET.code]) {
    expect(screen.queryByText(option.label)).toBeNull();
  }
});

it('소분류를 누르면 onChangePetDetailType이 그 코드로 불린다', async () => {
  const { props, onChangePetDetailType } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(FIRST_DETAIL.label));

  expect(onChangePetDetailType).toHaveBeenCalledWith(FIRST_DETAIL.code);
});

it('고른 소분류를 다시 누르면 null로 알린다', async () => {
  const { props, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(FIRST_DETAIL.label));

  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('대분류를 다른 것으로 바꾸면 고른 소분류를 푼다', async () => {
  const { props, onChangePetType, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(SECOND_PET.label));

  expect(onChangePetType).toHaveBeenCalledWith(SECOND_PET.code);
  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('대분류를 「전체」로 풀어도 소분류를 푼다', async () => {
  const { props, onChangePetType, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductFilterRow {...props} />);

  // 고른 대분류를 다시 누르면 null(전체)로 풀린다
  await fireEvent.press(screen.getByText(FIRST_PET.label));

  expect(onChangePetType).toHaveBeenCalledWith(null);
  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('같은 대분류를 다시 고르는 게 아니면 소분류가 없을 때는 안 푼다', async () => {
  const { props, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: null,
  });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(SECOND_PET.label));

  expect(onChangePetDetailType).not.toHaveBeenCalled();
});

it('대분류가 바뀌면 소분류 줄의 내용도 바뀐다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  const view = await render(<ProductFilterRow {...props} />);

  expect(screen.getByText(FIRST_DETAIL.label)).toBeTruthy();

  await view.rerender(<ProductFilterRow {...props} petType={SECOND_PET.code} />);

  expect(screen.queryByText(FIRST_DETAIL.label)).toBeNull();
  expect(screen.getByText(PET_DETAIL_OPTIONS_BY_TYPE[SECOND_PET.code][0].label)).toBeTruthy();
});

// ── 카테고리 그림 (Task 3) ──────────────────────────────────────────

it('카테고리 여덟 개가 다 이름과 함께 나온다', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  for (const option of CATEGORY_OPTIONS) {
    expect(screen.getByText(option.label)).toBeTruthy();
  }
});

it('고른 카테고리가 선택 상태로 표시된다', async () => {
  const { props } = renderRow({ category: CATEGORY_OPTIONS[0].code });
  await render(<ProductFilterRow {...props} />);

  expect(
    screen.getByRole('button', { name: CATEGORY_OPTIONS[0].label, selected: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: CATEGORY_OPTIONS[1].label, selected: false }),
  ).toBeTruthy();
});

it('고른 카테고리를 다시 누르면 null로 알린다', async () => {
  const { props, onChangeCategory } = renderRow({ category: CATEGORY_OPTIONS[0].code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByText(CATEGORY_OPTIONS[0].label));

  expect(onChangeCategory).toHaveBeenCalledWith(null);
});
