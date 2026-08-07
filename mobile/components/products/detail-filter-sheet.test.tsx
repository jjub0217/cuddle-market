import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import type { PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PRODUCT_STATUS_OPTIONS } from '@cuddle/shared';

import { DRAG_TEST_ID } from '@/components/ui/bottom-sheet';

import { CITIES } from '@/constants/cities';

import {
  DetailFilterSheet,
  EMPTY_DETAIL_FILTER,
  REGION_BACK_TEST_ID,
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

/** 시/군/구를 보다가 시/도 목록으로 되돌아간다. 글자 대신 표식으로 누른다. */
async function 되돌아간다() {
  await fireEvent.press(screen.getByTestId(REGION_BACK_TEST_ID));
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

it('초기화를 누르면 **곧바로** 빈 조건으로 알린다', async () => {
  // ⚠️ 다른 것과 달리 「적용」을 기다리지 않는다. 「다 지우고 처음으로」는 그 자체로 끝난
  //    행동이라, 누른 뒤에 한 번 더 눌러야 하면 어색하다 — 실기기에서 「초기화를 눌렀는데
  //    목록이 그대로다」로 걸렸다(2026-08-06). 웹도 「필터 초기화」는 즉시 반영한다.
  const { props, onApply } = setup({
    productStatus: STATUS.code,
    price: { min: 0, max: 10000 },
    sido: '서울특별시',
    gugun: SEOUL_GUGUN,
  });
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText('초기화'));

  // 「적용」을 안 눌렀는데도 이미 알렸다
  expect(onApply).toHaveBeenCalledWith(EMPTY_DETAIL_FILTER);

  // 시/도가 풀렸으니 시/군/구 단계에서 나와 시/도 목록으로 돌아온다
  expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();
  expect(screen.queryByTestId(REGION_BACK_TEST_ID)).toBeNull();
  expect(screen.getByRole('button', { name: '서울특별시', selected: false })).toBeTruthy();
});

// 지역은 **한 번에 한 목록만** 펼친다(#855 후속). 시/도 17개와 시/군/구 최대 30개를
// 함께 펼치면 시트가 화면을 넘어 안쪽 스크롤이 필요했고, 그 스크롤 때문에 쓸어 닫기가
// 손을 떼야 반응했다.
describe('지역 2단계', () => {
  it('시/도를 고르면 시/도 목록이 사라지고 시/군/구가 나온다', async () => {
    const { props } = setup();
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();

    await fireEvent.press(screen.getByText('서울특별시'));

    expect(screen.getByText(SEOUL_GUGUN)).toBeTruthy();
    // 다른 시/도 알약은 이제 없다 — 그 자리를 시/군/구가 차지했다
    expect(screen.queryByText('부산광역시')).toBeNull();
    // 고른 시/도는 되돌아가기 표시에 남는다
    expect(screen.getByTestId(REGION_BACK_TEST_ID)).toBeTruthy();
  });

  it('되돌아가면 시/도 목록이 다시 나오고 고른 시/도가 그대로다', async () => {
    const { props, onApply } = setup();
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    await fireEvent.press(screen.getByText('서울특별시'));
    await fireEvent.press(screen.getByText(SEOUL_GUGUN));
    await 되돌아간다();

    // 시/도 목록이 돌아왔고, 서울은 골라진 채다
    expect(screen.getByRole('button', { name: '서울특별시', selected: true })).toBeTruthy();
    expect(screen.getByText('부산광역시')).toBeTruthy();
    expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();
    // 되돌아간 것만으로는 아무것도 안 풀린다 — 고른 시/군/구도 그대로 나간다
    await fireEvent.press(screen.getByText('적용'));
    expect(onApply).toHaveBeenCalledWith({
      ...EMPTY_DETAIL_FILTER,
      sido: '서울특별시',
      gugun: SEOUL_GUGUN,
    });
  });

  it('되돌아가서 다른 시/도를 고르면 시/군/구가 풀린다', async () => {
    const { props, onApply } = setup();
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    await fireEvent.press(screen.getByText('서울특별시'));
    await fireEvent.press(screen.getByText(SEOUL_GUGUN));
    await 되돌아간다();
    await fireEvent.press(screen.getByText('부산광역시'));

    // 부산의 시/군/구 단계로 넘어갔다. 서울의 구는 남아 있지 않다
    expect(screen.queryByText(SEOUL_GUGUN)).toBeNull();
    expect(screen.getByRole('button', { name: BUSAN_GUGUN, selected: false })).toBeTruthy();

    await fireEvent.press(screen.getByText('적용'));
    expect(onApply).toHaveBeenCalledWith({
      ...EMPTY_DETAIL_FILTER,
      sido: '부산광역시',
      gugun: null,
    });
  });

  it('되돌아가서 고른 시/도를 다시 누르면 지역이 풀린다', async () => {
    const { props, onApply } = setup();
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    await fireEvent.press(screen.getByText('서울특별시'));
    await fireEvent.press(screen.getByText(SEOUL_GUGUN));
    await 되돌아간다();
    await fireEvent.press(screen.getByText('서울특별시'));

    // 풀렸으니 시/도 목록에 그대로 머무르고, 되돌아가기 표시도 없다
    expect(screen.getByRole('button', { name: '서울특별시', selected: false })).toBeTruthy();
    expect(screen.queryByTestId(REGION_BACK_TEST_ID)).toBeNull();

    await fireEvent.press(screen.getByText('적용'));
    expect(onApply).toHaveBeenCalledWith(EMPTY_DETAIL_FILTER);
  });

  it('시/도가 있는 채로 열면 시/군/구 단계로 열린다', async () => {
    const { props } = setup({ ...EMPTY_DETAIL_FILTER, sido: '서울특별시', gugun: SEOUL_GUGUN });
    await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: SEOUL_GUGUN, selected: true })).toBeTruthy();
    expect(screen.queryByText('부산광역시')).toBeNull();
  });

  it('되돌아간 채로 닫았다 다시 열면 시/군/구 단계로 돌아온다', async () => {
    const { props } = setup({ ...EMPTY_DETAIL_FILTER, sido: '서울특별시', gugun: SEOUL_GUGUN });
    const view = await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

    await 되돌아간다();
    expect(screen.getByText('부산광역시')).toBeTruthy();

    await view.rerender(<DetailFilterSheet {...props} visible={false} />);
    await view.rerender(<DetailFilterSheet {...props} visible />);

    // 이어서 좁히려는 것이지 시/도부터 다시 고르려는 게 아니다
    expect(screen.getByText(SEOUL_GUGUN)).toBeTruthy();
    expect(screen.queryByText('부산광역시')).toBeNull();
  });
});

// 안쪽 스크롤이 없어져 「굴리기냐 닫기냐」를 가릴 일이 사라졌다. 남은 것은 하나 —
// 이 시트가 여전히 쓸어 닫기를 켜 두었는가.
// ⚠️ **얼마나 쓸어야 닫히는지는 여기서 못 잡는다.** activeOffsetY 는 네이티브가 재는
//    값이라 jest 의 흉내내기는 거리와 상관없이 제스처를 활성 상태로 만든다
//    (bottom-sheet.test.tsx 의 같은 설명). 손을 떼기 전에 반응하는지는 실기기로 봐야 한다.
it('시트를 아래로 쓸면 닫힌다고 알린다', async () => {
  const { props, onClose } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  fireGestureHandler<PanGesture>(getByGestureTestId(DRAG_TEST_ID), [
    { translationY: 0, velocityY: 0 },
    { translationY: 40, velocityY: 0 },
    // 5 = 손을 뗀 상태(END)
    { state: 5, translationY: 40, velocityY: 0 },
  ]);

  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

it('고른 알약을 다시 누르면 풀린다', async () => {
  const { props, onApply } = setup();
  await render(<DetailFilterSheet {...props} />, { wrapper: Wrapper });

  await fireEvent.press(screen.getByText(STATUS.label));
  await fireEvent.press(screen.getByText(STATUS.label));
  await fireEvent.press(screen.getByText('적용'));

  expect(onApply).toHaveBeenCalledWith(EMPTY_DETAIL_FILTER);
});
