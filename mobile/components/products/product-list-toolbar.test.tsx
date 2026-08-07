import { fireEvent, render as rtlRender, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ProductListToolbar, SORT_TYPE } from './product-list-toolbar';

// ⚠️ render·rerender·fireEvent는 셋 다 기다려야 한다(mobile/AGENTS.md).
// 안 기다리면 오류 없이 옛 값을 줘서 틀린 것을 조용히 통과시킨다.

// 정렬 목록이 쓰는 BottomSheet가 useSafeAreaInsets를 부른다. 시험에서는 재는 사람이 없어
// 「No safe area value available」로 터지므로, 값을 못 박아 감싸 준다(아이폰 14 기준).
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function render(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>
    ),
  });
}

function makeProps(overrides: Partial<React.ComponentProps<typeof ProductListToolbar>> = {}) {
  const onChangeProductType = jest.fn();
  const onChangeSort = jest.fn();
  const onPressFilter = jest.fn();
  return {
    onChangeProductType,
    onChangeSort,
    onPressFilter,
    props: {
      productType: null,
      sortBy: 'createdAt',
      onChangeProductType,
      onChangeSort,
      onPressFilter,
      ...overrides,
    },
  };
}

it('알약 셋과 정렬·세부 필터 단추가 보인다', async () => {
  const { props } = makeProps();
  await render(<ProductListToolbar {...props} />);

  expect(screen.getByText('전체')).toBeTruthy();
  expect(screen.getByText('판매')).toBeTruthy();
  expect(screen.getByText('판매요청')).toBeTruthy();
  expect(screen.getByTestId('open-detail-filter')).toBeTruthy();
  expect(screen.getByTestId('open-sort')).toBeTruthy();
});

it('상품 개수는 안 보여준다 (웹에 없다)', async () => {
  const { props } = makeProps();
  await render(<ProductListToolbar {...props} />);

  expect(screen.queryByText(/개$/)).toBeNull();
  expect(screen.queryByText(/건$/)).toBeNull();
});

it('판매를 누르면 SELL로 알린다', async () => {
  const { props, onChangeProductType } = makeProps();
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByText('판매'));

  expect(onChangeProductType).toHaveBeenCalledWith('SELL');
});

it('판매요청을 누르면 REQUEST로 알린다', async () => {
  const { props, onChangeProductType } = makeProps();
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByText('판매요청'));

  expect(onChangeProductType).toHaveBeenCalledWith('REQUEST');
});

it('전체를 누르면 null로 알린다 (ALL이라는 글자를 보내지 않는다)', async () => {
  const { props, onChangeProductType } = makeProps({ productType: 'SELL' });
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByText('전체'));

  expect(onChangeProductType).toHaveBeenCalledWith(null);
});

it('지금 고른 상품 종류가 표시된다', async () => {
  const { props } = makeProps({ productType: 'SELL' });
  const view = await render(<ProductListToolbar {...props} />);

  expect(screen.getByRole('button', { name: '판매', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '전체', selected: false })).toBeTruthy();

  // 값이 바뀌면 표시도 따라 바뀐다
  await view.rerender(<ProductListToolbar {...props} productType={null} />);

  expect(screen.getByRole('button', { name: '전체', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '판매', selected: false })).toBeTruthy();
});

it('정렬을 고르면 그 id로 알린다', async () => {
  const { props, onChangeSort } = makeProps();
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByTestId('open-sort'));
  await fireEvent.press(screen.getByTestId('sort-orderedLowPriced'));

  expect(onChangeSort).toHaveBeenCalledWith('orderedLowPriced');
});

it('정렬 목록에 웹 SORT_TYPE 네 개가 다 있다', async () => {
  const { props } = makeProps();
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByTestId('open-sort'));

  for (const sort of SORT_TYPE) {
    expect(screen.getByTestId(`sort-${sort.id}`)).toBeTruthy();
  }
});

it('지금 고른 정렬이 단추에 보인다', async () => {
  const { props } = makeProps({ sortBy: 'favoriteCount' });
  const view = await render(<ProductListToolbar {...props} />);

  // 열어 보지 않아도 지금 고른 것이 보인다
  expect(screen.getByTestId('open-sort')).toHaveTextContent('찜 많은 순');

  await view.rerender(<ProductListToolbar {...props} sortBy="orderedHighPriced" />);

  expect(screen.getByTestId('open-sort')).toHaveTextContent('고가순');
});

it('목록 안에서도 지금 고른 정렬이 선택 상태다', async () => {
  const { props } = makeProps({ sortBy: 'orderedHighPriced' });
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByTestId('open-sort'));

  expect(screen.getByRole('button', { name: '고가순', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '최신순', selected: false })).toBeTruthy();
});

it('모르는 정렬 id가 오면 최신순으로 보여준다', async () => {
  const { props } = makeProps({ sortBy: '' });
  await render(<ProductListToolbar {...props} />);

  expect(screen.getByTestId('open-sort')).toHaveTextContent('최신순');
});

it('⚙를 누르면 onPressFilter가 불린다 (시트는 여기서 안 연다)', async () => {
  const { props, onPressFilter, onChangeProductType, onChangeSort } = makeProps();
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByTestId('open-detail-filter'));

  expect(onPressFilter).toHaveBeenCalledTimes(1);
  expect(onChangeProductType).not.toHaveBeenCalled();
  expect(onChangeSort).not.toHaveBeenCalled();
});
