import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheet, DRAG_TEST_ID } from './bottom-sheet';

// ⚠️ render·rerender·fireEvent는 셋 다 기다려야 한다(mobile/AGENTS.md).
//
// **움직임 자체(몇 점 내려갔는지)는 여기서 안 본다.** 그건 실기기의 손가락 입력과
// 네이티브 계산이 얽혀 있어 흉내 내 봐야 진짜와 다르게 돈다. 대신 **결과**를 본다 —
// 「끌어 내리면 닫힌다고 알리는가」, 「덜 내리면 안 알리는가」.
//
// ⚠️ 제스처 안에서 부른 onClose 는 **한 박자 뒤에** 도착한다(runOnJS 가 손가락 쪽에서
//    자바스크립트 쪽으로 건네주는 데 한 번 쉰다). 그래서 waitFor 로 기다린다 —
//    바로 확인하면 아직 안 왔다고 나온다.

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// 시험에서는 시트 높이를 못 잰다(진짜로 그려지지 않으니 onLayout 이 안 온다).
// 그래서 「숨은 자리」가 화면 높이(844)이고, 닫히는 기준은 그 1/4인 211쯤이다.
// 아래 숫자들은 그 선을 넉넉히 넘기거나 못 미치게 골랐다.
// 조각의 DRAG_CLOSE_DP(56dp)를 넘느냐 못 넘느냐로 갈린다.
// ⚠️ 시트 높이와 상관없는 값이다 — 시트가 손을 따라 움직이지 않으니
//    「얼마나 왔나」가 아니라 「얼마나 밀었나」만 본다.
const 충분히 = 80;
const 조금 = 40;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

/** 손잡이를 잡고 아래로 끌다 놓는다. */
function 끌어내린다(거리: number, 속도: number) {
  fireGestureHandler<PanGesture>(getByGestureTestId(DRAG_TEST_ID), [
    { translationY: 0, velocityY: 0 },
    { translationY: 거리, velocityY: 속도 },
    // 5 = 손을 뗀 상태(END)
    { state: 5, translationY: 거리, velocityY: 속도 },
  ]);
}

describe('BottomSheet', () => {
  it('보이라고 하면 담은 것을 그린다', async () => {
    await render(
      <BottomSheet visible onClose={jest.fn()}>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('안에 담은 것')).toBeTruthy();
  });

  it('바깥을 누르면 닫힌다고 알린다', async () => {
    const 닫힘 = jest.fn();
    await render(
      <BottomSheet visible onClose={닫힘}>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    await fireEvent.press(screen.getByLabelText('닫기'));

    expect(닫힘).toHaveBeenCalled();
  });

  it('손잡이는 끌어 닫기를 켠 시트에만 있다', async () => {
    // 손잡이가 없던 다섯 시트(상품 ⋮ 메뉴 등)는 지금까지와 똑같이 보여야 한다.
    const view = await render(
      <BottomSheet visible onClose={jest.fn()}>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );
    expect(screen.queryByLabelText('끌어내려 닫기')).toBeNull();

    await view.rerender(
      <BottomSheet visible onClose={jest.fn()} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>
    );
    expect(screen.getByLabelText('끌어내려 닫기')).toBeTruthy();
  });

  it('손잡이를 충분히 아래로 밀면 닫힌다고 알린다', async () => {
    const 닫힘 = jest.fn();
    await render(
      <BottomSheet visible onClose={닫힘} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    끌어내린다(충분히, 300);

    await waitFor(() => expect(닫힘).toHaveBeenCalled());
  });

  it('조금만 밀면 안 닫힌다', async () => {
    const 닫힘 = jest.fn();
    await render(
      <BottomSheet visible onClose={닫힘} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    끌어내린다(조금, 100);

    // 「아직 안 왔을 뿐」이 아니라 정말 안 부른 것임을 보려면 한 박자 기다렸다 확인한다.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(닫힘).not.toHaveBeenCalled();
  });

  it('조금만 밀었어도 휙 튕겨 내리면 닫힌다', async () => {
    const 닫힘 = jest.fn();
    await render(
      <BottomSheet visible onClose={닫힘} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    끌어내린다(조금, 1500);

    await waitFor(() => expect(닫힘).toHaveBeenCalled());
  });
});
