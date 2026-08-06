import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import type { PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PRODUCT_STATUS_OPTIONS } from '@cuddle/shared';

import { CITIES } from '@/constants/cities';

import { DRAG_TEST_ID } from '@/components/ui/bottom-sheet';

import {
  DetailFilterSheet,
  EMPTY_DETAIL_FILTER,
  FILTER_LIST_TEST_ID,
} from './detail-filter-sheet';

// ⚠️ render·rerender·fireEvent는 셋 다 기다려야 한다(mobile/AGENTS.md) —
//    안 기다리면 오류 없이 옛 값을 줘서 틀린 것을 조용히 통과시킨다.

// 시트 껍데기가 안전영역(insets)을 읽으므로 시험에서도 그 값을 줘야 한다.
// 실기기 값 대신 못 박은 값을 쓴다 — 아래 34는 아이폰 제스처 바쯤이다.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

const STATUS = PRODUCT_STATUS_OPTIONS[0]; // 새 상품
const SEOUL_GUGUN = CITIES['서울특별시'][0];
const BUSAN_GUGUN = CITIES['부산광역시'][0];

function setup(value = EMPTY_DETAIL_FILTER) {
  const onApply = jest.fn();
  const onClose = jest.fn();
  return {
    onApply,
    onClose,
    props: { visible: true, value, onApply, onClose },
  };
}

it('상태·가격·지역을 고르고 적용하면 고른 값으로 알린다', async () => {
  const { props, onApply } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText(STATUS.label));
  await fireEvent.press(screen.getByText('1만원~5만원'));
  await fireEvent.press(screen.getByText('서울특별시'));
  await fireEvent.press(screen.getByText(SEOUL_GUGUN));
  await fireEvent.press(screen.getByText('적용'));

  expect(onApply).toHaveBeenCalledWith({
    productStatus: STATUS.code,
    price: { min: 10000, max: 50000 },
    sido: '서울특별시',
    gugun: SEOUL_GUGUN,
  });
});

it('위 끝이 없는 구간(10만원 이상)은 max가 null이다', async () => {
  const { props, onApply } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText('10만원 이상'));
  await fireEvent.press(screen.getByText('적용'));

  expect(onApply).toHaveBeenCalledWith({
    ...EMPTY_DETAIL_FILTER,
    price: { min: 100000, max: null },
  });
});

it('고른 뒤 그냥 닫으면 알리지 않는다', async () => {
  const { props, onApply, onClose } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText(STATUS.label));
  await fireEvent.press(screen.getByLabelText('닫기'));

  expect(onClose).toHaveBeenCalled();
  expect(onApply).not.toHaveBeenCalled();
});

it('그냥 닫았다가 다시 열면 고르던 것이 버려지고 열 때 값으로 되돌아간다', async () => {
  const { props } = setup();
  const view = await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText(STATUS.label));
  expect(screen.getByRole('button', { name: STATUS.label, selected: true })).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('닫기'));
  await view.rerender(<DetailFilterSheet {...props} visible={false} />);
  await view.rerender(<DetailFilterSheet {...props} visible />);

  expect(screen.getByRole('button', { name: STATUS.label, selected: false })).toBeTruthy();
});

it('열 때 값이 있으면 그게 골라진 채로 보인다', async () => {
  const { props } = setup({
    productStatus: STATUS.code,
    price: { min: 0, max: 10000 },
    sido: '서울특별시',
    gugun: SEOUL_GUGUN,
  });
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  expect(screen.getByRole('button', { name: STATUS.label, selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '1만원 이하', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: SEOUL_GUGUN, selected: true })).toBeTruthy();
});

it('초기화를 누르면 시트 안의 조건이 다 풀린다', async () => {
  const { props, onApply } = setup({
    productStatus: STATUS.code,
    price: { min: 0, max: 10000 },
    sido: '서울특별시',
    gugun: SEOUL_GUGUN,
  });
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText('초기화'));

  // 시/도가 풀렸으니 시/군/구 줄도 사라진다
  expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();

  await fireEvent.press(screen.getByText('적용'));
  expect(onApply).toHaveBeenCalledWith(EMPTY_DETAIL_FILTER);
});

it('시/도를 골라야 시/군/구가 나타난다', async () => {
  const { props } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();

  await fireEvent.press(screen.getByText('서울특별시'));

  expect(screen.getByText(SEOUL_GUGUN)).toBeTruthy();
});

it('시/도를 바꾸면 고른 시/군/구가 풀린다', async () => {
  const { props, onApply } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText('서울특별시'));
  await fireEvent.press(screen.getByText(SEOUL_GUGUN));
  await fireEvent.press(screen.getByText('부산광역시'));

  // 서울의 구는 이제 안 보이고, 고른 것도 남아 있지 않다
  expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();
  expect(screen.getByRole('button', { name: BUSAN_GUGUN, selected: false })).toBeTruthy();

  await fireEvent.press(screen.getByText('적용'));
  expect(onApply).toHaveBeenCalledWith({
    ...EMPTY_DETAIL_FILTER,
    sido: '부산광역시',
    gugun: null,
  });
});

// 안쪽이 굴러가는 **유일한** 시트라, 굴리기와 시트 끌기가 갈리는지는 여기서 본다.
// 껍데기 쪽 시험(bottom-sheet.test.tsx)이 규칙 자체를 보고, 여기서는 **그 규칙이
// 이 시트에 실제로 연결돼 있는지**를 본다 — SheetScrollView 를 그냥 ScrollView 로
// 되돌리면 여기서 걸린다.
describe('굴리기와 시트 끌기 가르기', () => {
  /** 시트를 잡고 아래로 충분히(56dp 넘게) 끌다 놓는다. */
  function 끌어내린다() {
    fireGestureHandler<PanGesture>(getByGestureTestId(DRAG_TEST_ID), [
      { translationY: 0, velocityY: 0 },
      { translationY: 80, velocityY: 300 },
      { state: 5, translationY: 80, velocityY: 300 },
    ]);
  }

  async function 목록을굴려둔다(y: number) {
    await fireEvent.scroll(screen.getByTestId(FILTER_LIST_TEST_ID), {
      nativeEvent: {
        contentOffset: { x: 0, y },
        contentSize: { width: 390, height: 2000 },
        layoutMeasurement: { width: 390, height: 500 },
      },
    });
  }

  it('목록이 맨 위면 아래로 밀어 닫는다', async () => {
    const { props, onClose } = setup();
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    await 목록을굴려둔다(0);
    끌어내린다();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('목록을 굴리는 중이면 아래로 밀어도 안 닫힌다', async () => {
    const { props, onClose } = setup();
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    await 목록을굴려둔다(300);
    끌어내린다();

    // 「아직 안 왔을 뿐」이 아니라 정말 안 부른 것임을 보려면 한 박자 기다렸다 확인한다.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

it('고른 알약을 다시 누르면 풀린다', async () => {
  const { props, onApply } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText(STATUS.label));
  await fireEvent.press(screen.getByText(STATUS.label));
  await fireEvent.press(screen.getByText('적용'));

  expect(onApply).toHaveBeenCalledWith(EMPTY_DETAIL_FILTER);
});
