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
  const onChangeOnlyOnSale = jest.fn();
  return {
    onChangeProductType,
    onChangeSort,
    onPressFilter,
    onChangeOnlyOnSale,
    props: {
      productType: null,
      sortBy: 'createdAt',
      onlyOnSale: false,
      onChangeProductType,
      onChangeSort,
      onPressFilter,
      onChangeOnlyOnSale,
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

// ----- 「판매중」 토글 (#1009) -----
//
// ⚠️ 시트(detail-filter-sheet)의 「상품 상태」와 다르다. 이건 **누르면 바로** 알린다.

it('판매중 토글이 보인다 (웹과 같은 문구)', async () => {
  const { props } = makeProps();
  await render(<ProductListToolbar {...props} />);

  // 문구는 웹 ProductsSection.tsx:118 의 「판매중」이다
  expect(screen.getByText('판매중')).toBeTruthy();
  expect(screen.getByTestId('toggle-only-on-sale')).toBeTruthy();
});

it('꺼져 있을 때 누르면 켜라고 알린다', async () => {
  const { props, onChangeOnlyOnSale } = makeProps();
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByTestId('toggle-only-on-sale'));

  expect(onChangeOnlyOnSale).toHaveBeenCalledWith(true);
});

it('켜져 있을 때 누르면 끄라고 알린다', async () => {
  const { props, onChangeOnlyOnSale } = makeProps({ onlyOnSale: true });
  await render(<ProductListToolbar {...props} />);

  await fireEvent.press(screen.getByTestId('toggle-only-on-sale'));

  expect(onChangeOnlyOnSale).toHaveBeenCalledWith(false);
});

it('켜짐/꺼짐이 소리로도 읽힌다', async () => {
  const { props } = makeProps();
  const view = await render(<ProductListToolbar {...props} />);

  expect(screen.getByRole('switch', { name: '판매중', checked: false })).toBeTruthy();

  await view.rerender(<ProductListToolbar {...props} onlyOnSale />);

  expect(screen.getByRole('switch', { name: '판매중', checked: true })).toBeTruthy();
});

// ----- 몇 건인지 (#1010) -----

it('건수를 받으면 웹과 같은 문구로 보여준다', async () => {
  const { props } = makeProps({ totalElements: 61 });
  await render(<ProductListToolbar {...props} />);

  // 문구는 웹 ProductListHeader(ProductsSection.tsx:20) 그대로다.
  // ⚠️ 「전체 N개」가 아니다 — 판매중을 켜면 걸러진 수가 오므로 「전체」는 거짓말이 된다
  expect(screen.getByText('상품 61개')).toBeTruthy();
  expect(screen.queryByText(/^전체 /)).toBeNull();
});

it('아직 못 받았으면 건수를 안 그린다 (「상품 0개」가 스치면 안 된다)', async () => {
  const { props } = makeProps();
  await render(<ProductListToolbar {...props} />);

  expect(screen.queryByTestId('product-total-count')).toBeNull();
});

it('0건도 그대로 보여준다 (0 을 「없음」으로 보면 안 된다)', async () => {
  const { props } = makeProps({ totalElements: 0 });
  await render(<ProductListToolbar {...props} />);

  expect(screen.getByText('상품 0개')).toBeTruthy();
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
