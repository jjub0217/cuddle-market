import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import type { PinchGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { PAGER_TEST_ID, PINCH_TEST_ID, PhotoViewer } from './photo-viewer';

// 앱 사진 확대창(#904).
//
// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md).
//
// ⚠️ 이 시험이 **안 덮는 것**: 손가락으로 넓히는 배율, 부드러움, 안드로이드 뒤로가기의
//    진짜 동작. 배율은 손가락 쪽(UI 쓰레드)에 있어 여기서 읽을 수 없다.
//    **실기기로 봐야 한다.**

const IMAGES = ['https://cdn/a.webp', 'https://cdn/b.webp'];

it('안 보일 때는 사진을 안 그린다', async () => {
  await render(<PhotoViewer images={IMAGES} visible={false} onClose={jest.fn()} />);

  expect(screen.queryByTestId(PAGER_TEST_ID)).toBeNull();
});

it('보이면 사진을 그린다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  expect(screen.getByTestId(PAGER_TEST_ID)).toBeTruthy();
});

it('닫기 단추를 누르면 닫힌다고 알린다', async () => {
  const 닫힘 = jest.fn();
  await render(<PhotoViewer images={IMAGES} visible onClose={닫힘} />);

  await fireEvent.press(screen.getByLabelText('닫기'));

  expect(닫힘).toHaveBeenCalledTimes(1);
});

it('뒤로가기로 닫힌다고 알린다', async () => {
  const 닫힘 = jest.fn();
  await render(<PhotoViewer images={IMAGES} visible onClose={닫힘} />);

  // 안드로이드 뒤로가기는 Modal 에 requestClose 로 들어온다.
  await fireEvent(screen.getByTestId('photo-viewer-modal'), 'requestClose');

  expect(닫힘).toHaveBeenCalledTimes(1);
});

it('여러 장이면 몇 번째인지 보여준다', async () => {
  await render(<PhotoViewer images={IMAGES} startIndex={1} visible onClose={jest.fn()} />);

  expect(screen.getByText('2 / 2')).toBeTruthy();
});

it('한 장이면 번호를 안 보여준다', async () => {
  await render(<PhotoViewer images={[IMAGES[0]]} visible onClose={jest.fn()} />);

  expect(screen.queryByText('1 / 1')).toBeNull();
});

// ⚠️ **배율 자체는 여기서 못 본다.** 배율은 손가락 쪽(UI 쓰레드)의 값이라
//    자바스크립트 쪽에서 읽히지 않는다. 대신 **결과**를 본다 —
//    「넓히면 좌우 넘기기가 꺼지는가」. 진짜 배율과 부드러움은 실기기로 본다.
function 넓힌다(배율: number) {
  fireGestureHandler<PinchGesture>(getByGestureTestId(PINCH_TEST_ID), [
    { scale: 1 },
    { scale: 배율 },
    // 5 = 손을 뗀 상태(END)
    { state: 5, scale: 배율 },
  ]);
}

it('처음에는 좌우로 넘길 수 있다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  expect(screen.getByTestId(PAGER_TEST_ID).props.scrollEnabled).toBe(true);
});

it('넓히면 좌우 넘기기가 꺼진다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  넓힌다(2);

  await waitFor(() => {
    expect(screen.getByTestId(PAGER_TEST_ID).props.scrollEnabled).toBe(false);
  });
});

it('다시 줄이면 좌우 넘기기가 켜진다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  넓힌다(2);
  넓힌다(1);

  await waitFor(() => {
    expect(screen.getByTestId(PAGER_TEST_ID).props.scrollEnabled).toBe(true);
  });
});
