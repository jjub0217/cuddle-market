import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { getAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheet, DRAG_TEST_ID, SHEET_TEST_ID, SheetScrollView } from './bottom-sheet';

// ⚠️ render·rerender·fireEvent는 셋 다 기다려야 한다(mobile/AGENTS.md).
//
// **움직임을 본다.** 시트가 손을 따라 내려가는 것이 이 조각의 일이 됐으므로(#855 후속),
// 「몇 점 내려갔는지」를 getAnimatedStyle 로 읽어 확인한다. 손가락 입력 자체는 흉내이지만,
// 「민 만큼 그 자리에 있는가 · 놓으면 제자리로 오는가」는 이렇게 봐야 알 수 있다.
//
// ⚠️ 제스처 안에서 부른 onClose 는 **한 박자 뒤에** 도착한다(runOnJS 가 손가락 쪽에서
//    자바스크립트 쪽으로 건네주는 데 한 번 쉰다). 그래서 waitFor 로 기다린다 —
//    바로 확인하면 아직 안 왔다고 나온다.

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// 조각의 DRAG_CLOSE_DP(56dp)를 넘느냐 못 넘느냐로 갈린다.
// ⚠️ 시트 높이와 상관없는 값이다 — 「얼마나 왔나」가 아니라 「얼마나 밀었나」로 정한다.
const 충분히 = 80;
const 조금 = 40;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

/** 시트를 잡고 아래로 끌다 놓는다. 잡는 자리는 시트 어디든 같다. */
function 끌어내린다(거리: number, 속도: number) {
  fireGestureHandler<PanGesture>(getByGestureTestId(DRAG_TEST_ID), [
    { translationY: 0, velocityY: 0 },
    { translationY: 거리, velocityY: 속도 },
    // 5 = 손을 뗀 상태(END)
    { state: 5, translationY: 거리, velocityY: 속도 },
  ]);
}

/** 손을 **안 뗀 채로** 거기까지 민다. 미는 동안의 모습을 보려는 것이다. */
function 미는중(거리: number) {
  fireGestureHandler<PanGesture>(getByGestureTestId(DRAG_TEST_ID), [
    { translationY: 0, velocityY: 0 },
    { translationY: 거리, velocityY: 0 },
  ]);
}

/** 지금 시트가 아래로 내려가 있는 거리. 0이면 제자리(다 올라온 상태)다. */
function 내려간거리() {
  const style = getAnimatedStyle(screen.getByTestId(SHEET_TEST_ID)) as {
    transform?: { translateY?: number }[];
  };
  return style.transform?.[0]?.translateY;
}

/** 안쪽 스크롤을 여기까지 굴려 둔다. 0이면 맨 위다. */
async function 스크롤을둔다(y: number) {
  await fireEvent.scroll(screen.getByTestId('안쪽 스크롤'), {
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { width: 390, height: 2000 },
      layoutMeasurement: { width: 390, height: 500 },
    },
  });
}

/** 움직임이 다 끝날 때까지 기다린다. 열리는 것도 제자리로 돌아가는 것도 잠깐 걸린다. */
async function 움직임이끝날때까지() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  });
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

  it('충분히 아래로 밀면 닫힌다고 알린다', async () => {
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

  it('미는 동안 손을 따라 그만큼 내려가 있다', async () => {
    await render(
      <BottomSheet visible onClose={jest.fn()} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );
    await 움직임이끝날때까지(); // 다 올라온 상태(0)에서 시작한다
    expect(내려간거리()).toBe(0);

    미는중(조금);

    expect(내려간거리()).toBe(조금);
  });

  it('위로 밀어도 시트는 커지지 않는다', async () => {
    await render(
      <BottomSheet visible onClose={jest.fn()} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );
    await 움직임이끝날때까지();

    미는중(-120);

    // 0 위로는 안 올라간다. 세부 필터 시트는 이미 최대 높이라 더 커질 자리가 없다.
    expect(내려간거리()).toBe(0);
  });

  it('조금만 밀고 놓으면 제자리로 돌아간다', async () => {
    const 닫힘 = jest.fn();
    await render(
      <BottomSheet visible onClose={닫힘} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );
    await 움직임이끝날때까지();

    끌어내린다(조금, 100);
    // 놓은 그 순간에는 아직 민 자리에 걸쳐 있다
    expect(내려간거리()).toBe(조금);

    await 움직임이끝날때까지();

    expect(내려간거리()).toBe(0);
    expect(닫힘).not.toHaveBeenCalled();
  });

  describe('안쪽이 굴러가는 시트', () => {
    function 굴러가는시트(닫힘: () => void) {
      return (
        <BottomSheet visible onClose={닫힘} dragToClose>
          <SheetScrollView testID="안쪽 스크롤">
            <Text>안에 담은 것</Text>
          </SheetScrollView>
        </BottomSheet>
      );
    }

    it('스크롤이 맨 위면 아래로 밀어 닫는다', async () => {
      const 닫힘 = jest.fn();
      await render(굴러가는시트(닫힘), { wrapper: Wrapper });
      await 움직임이끝날때까지();

      await 스크롤을둔다(0);
      끌어내린다(충분히, 300);

      await waitFor(() => expect(닫힘).toHaveBeenCalled());
    });

    it('스크롤이 맨 위가 아니면 아래로 밀어도 안 닫히고 시트도 안 움직인다', async () => {
      const 닫힘 = jest.fn();
      await render(굴러가는시트(닫힘), { wrapper: Wrapper });
      await 움직임이끝날때까지();

      // 안쪽을 한참 굴려 둔 상태. 여기서 아래로 미는 것은 「굴리려는 것」이다.
      await 스크롤을둔다(300);
      끌어내린다(충분히, 300);

      expect(내려간거리()).toBe(0);
      await 움직임이끝날때까지();
      expect(닫힘).not.toHaveBeenCalled();
    });

    it('굴러가 있는 목록을 아래로 휙 튕겨도 안 닫힌다', async () => {
      // ⚠️ 「휙 내리기」는 속도만 보고 닫는다. 굴리기는 손을 뗄 때 속도가 큰 게 당연하므로,
      //    시트가 실제로 움직인 적이 있는지를 같이 안 보면 굴리다가 시트가 닫혀 버린다.
      const 닫힘 = jest.fn();
      await render(굴러가는시트(닫힘), { wrapper: Wrapper });
      await 움직임이끝날때까지();

      await 스크롤을둔다(300);
      끌어내린다(조금, 2000);

      await 움직임이끝날때까지();
      expect(닫힘).not.toHaveBeenCalled();
    });
  });
});
