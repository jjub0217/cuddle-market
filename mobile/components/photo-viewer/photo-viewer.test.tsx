import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { PAGER_TEST_ID, PhotoViewer } from './photo-viewer';

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
