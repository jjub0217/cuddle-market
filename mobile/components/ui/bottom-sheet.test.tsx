import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheet, DRAG_TEST_ID, SheetScrollView } from './bottom-sheet';

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

// ⚠️ **「얼마나 쓸어야 닫히나」는 여기서 못 잡는다.** 그 경계(DRAG_CLOSE_DP)는
//    activeOffsetY 가 **네이티브에서** 재는 것이라, jest 의 흉내내기는 거리와 상관없이
//    제스처를 활성 상태로 만들어 버린다. 여기서 지킬 수 있는 것은 「쓸면 닫힌다고
//    알리는가」까지다 — 살짝만 쓸어도 닫히는지는 **실기기로** 봐야 한다.
const 쓸어내린다_거리 = 40;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

/** 시트를 잡고 아래로 쓸어내린다. 잡는 자리는 시트 어디든 같다(제스처가 하나뿐이다). */
function 쓸어내린다(거리: number = 쓸어내린다_거리) {
  fireGestureHandler<PanGesture>(getByGestureTestId(DRAG_TEST_ID), [
    { translationY: 0, velocityY: 0 },
    { translationY: 거리, velocityY: 0 },
    // 5 = 손을 뗀 상태(END)
    { state: 5, translationY: 거리, velocityY: 0 },
  ]);
}

const 안쪽스크롤 = '안쪽 스크롤';

/** 안쪽 스크롤을 여기까지 굴려 둔다. 0이면 맨 위다. */
async function 스크롤을둔다(y: number) {
  await fireEvent.scroll(screen.getByTestId(안쪽스크롤), {
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { width: 390, height: 2000 },
      layoutMeasurement: { width: 390, height: 500 },
    },
  });
}

/** 한 박자 기다린다. 「아직 안 왔을 뿐」과 「정말 안 불렀다」를 가르려면 필요하다. */
async function 한박자쉰다() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
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

  it('시트를 아래로 쓸면 닫힌다고 알린다', async () => {
    // ⚠️ **얼마나 쓸어야 닫히는지는 여기서 못 잡는다**(위 상수 설명 참고).
    //    「살짝만 쓸어도 닫히는가」·「위로 쓸면 안 닫히는가」는 실기기로 봐야 한다.
    //    **어디를 쓰느냐**도 여기서는 못 잡는다 — 제스처가 하나뿐이라 시험은 그것만
    //    집어 흔들 뿐, 그 제스처가 손잡이에 붙었는지 시트 전체에 붙었는지 모른다.
    const 닫힘 = jest.fn();
    await render(
      <BottomSheet visible onClose={닫힘} dragToClose>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    쓸어내린다();

    await waitFor(() => expect(닫힘).toHaveBeenCalled());
  });

  it('쓸어 닫기를 안 켠 시트에는 쓸기 제스처가 아예 없다', async () => {
    // 손잡이가 없던 다섯 시트(고르는 칸·지역·정렬·상품 ⋮ 메뉴)는 지금까지와 똑같아야 한다.
    await render(
      <BottomSheet visible onClose={jest.fn()}>
        <Text>안에 담은 것</Text>
      </BottomSheet>,
      { wrapper: Wrapper }
    );

    expect(() => getByGestureTestId(DRAG_TEST_ID)).toThrow();
  });

  // 시트 전체를 쓸어 닫게 넓히면서 생긴 유일한 다툼이다.
  // **판정은 쓸기가 시작될 때 한 번만** 한다 — 그때 안쪽 스크롤이 맨 위였는지만 본다.
  describe('안이 굴러가는 시트에서 굴리기와 가르기', () => {
    function 굴러가는시트(닫힘: () => void) {
      return (
        <BottomSheet visible onClose={닫힘} dragToClose>
          <SheetScrollView testID={안쪽스크롤}>
            <Text>안에 담은 것</Text>
          </SheetScrollView>
        </BottomSheet>
      );
    }

    it('스크롤이 맨 위면 아래로 쓸어 닫는다', async () => {
      const 닫힘 = jest.fn();
      await render(굴러가는시트(닫힘), { wrapper: Wrapper });

      await 스크롤을둔다(0);
      쓸어내린다();

      await waitFor(() => expect(닫힘).toHaveBeenCalled());
    });

    it('스크롤이 맨 위가 아니면 아래로 쓸어도 안 닫힌다', async () => {
      // 안쪽을 한참 굴려 둔 상태. 여기서 아래로 쓰는 것은 「목록을 굴리려는 것」이다.
      const 닫힘 = jest.fn();
      await render(굴러가는시트(닫힘), { wrapper: Wrapper });

      await 스크롤을둔다(300);
      쓸어내린다();

      await 한박자쉰다();
      expect(닫힘).not.toHaveBeenCalled();
    });

    it('맨 위로 되돌려 놓으면 다시 쓸어 닫힌다', async () => {
      // 굴렸다가 맨 위까지 되돌아오면 「닫으려는 것」으로 되돌아가야 한다.
      const 닫힘 = jest.fn();
      await render(굴러가는시트(닫힘), { wrapper: Wrapper });

      await 스크롤을둔다(300);
      await 스크롤을둔다(0);
      쓸어내린다();

      await waitFor(() => expect(닫힘).toHaveBeenCalled());
    });
  });
});
