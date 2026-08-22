import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ProfileImageField } from './profile-image-field';

// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md) —
//    안 그러면 오류 없이 옛 값을 줘서 조용히 틀린 것을 통과시킨다.

jest.mock('@/lib/product-images', () => ({
  pickImages: jest.fn(),
  shrinkImage: jest.fn(),
  uploadOne: jest.fn(),
}));

const { pickImages, shrinkImage, uploadOne } = jest.requireMock('@/lib/product-images') as {
  pickImages: jest.Mock;
  shrinkImage: jest.Mock;
  uploadOne: jest.Mock;
};

const PICK = 'profile-image-pick';

beforeEach(() => {
  pickImages.mockReset();
  shrinkImage.mockReset();
  uploadOne.mockReset();
});

it('사진이 없으면 닉네임 첫 글자를 그린다', async () => {
  // 웹·앱이 이미 그렇게 한다 — 둘 다 `nickname.charAt(0).toUpperCase()` 다
  // (`ProfileAvatar.tsx` · `user-profile/profile-head.tsx`).
  // 대표 그림으로 바꾸지 않는다 — 그러면 소셜 가입자가 다 똑같아 보인다(설계 §6).
  await render(<ProfileImageField url={null} nickname="협주" onChange={jest.fn()} />);

  expect(screen.getByText('협')).toBeTruthy();
});

it('첫 글자는 대문자로 그린다', async () => {
  await render(<ProfileImageField url={null} nickname="hyeopju" onChange={jest.fn()} />);

  expect(screen.getByText('H')).toBeTruthy();
});

it('닉네임이 비어도 터지지 않는다', async () => {
  await render(<ProfileImageField url={null} nickname="" onChange={jest.fn()} />);

  expect(screen.getByTestId(PICK)).toBeTruthy();
});

it('고르면 줄이고 올린 뒤 그 주소로 알린다', async () => {
  const onChange = jest.fn();
  pickImages.mockResolvedValue([{ uri: 'file://a.jpg' }]);
  shrinkImage.mockResolvedValue('file://small.webp');
  uploadOne.mockResolvedValue('https://cdn/a.webp');

  await render(<ProfileImageField url={null} nickname="협주" onChange={onChange} />);
  await fireEvent.press(screen.getByTestId(PICK));

  await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://cdn/a.webp'));
  // ⚠️ 줄이기를 건너뛰면 안 된다. 폰 사진은 3~8MB라 서버가 거절한다(한 장 5MB 제한)
  expect(shrinkImage).toHaveBeenCalledWith('file://a.jpg');
  expect(uploadOne).toHaveBeenCalledWith('file://small.webp');
});

it('한 장만 고르게 한다', async () => {
  pickImages.mockResolvedValue([]);

  await render(<ProfileImageField url={null} nickname="협주" onChange={jest.fn()} />);
  await fireEvent.press(screen.getByTestId(PICK));

  await waitFor(() => expect(pickImages).toHaveBeenCalledWith(1));
});

it('고르다 그만두면 아무 일도 없다', async () => {
  const onChange = jest.fn();
  pickImages.mockResolvedValue([]); // 취소하면 빈 목록이 온다

  await render(<ProfileImageField url={null} nickname="협주" onChange={onChange} />);
  await fireEvent.press(screen.getByTestId(PICK));

  await waitFor(() => expect(pickImages).toHaveBeenCalled());
  expect(shrinkImage).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});

it('올리다 실패하면 알리지 않고 다시 누를 수 있게 둔다', async () => {
  const onChange = jest.fn();
  pickImages.mockResolvedValue([{ uri: 'file://a.jpg' }]);
  shrinkImage.mockResolvedValue('file://small.webp');
  uploadOne.mockRejectedValue(new Error('이미지 업로드에 실패했습니다. 다시 시도해주세요.'));

  await render(<ProfileImageField url={null} nickname="협주" onChange={onChange} />);
  await fireEvent.press(screen.getByTestId(PICK));

  // 실패했으니 밖으로 알리지 않는다 — 저장할 때 없는 주소가 실리면 안 된다
  await waitFor(() => expect(uploadOne).toHaveBeenCalled());
  expect(onChange).not.toHaveBeenCalled();

  // 다시 누를 수 있어야 한다. 못 누르게 잠기면 사진을 영영 못 바꾼다
  pickImages.mockResolvedValue([]);
  await fireEvent.press(screen.getByTestId(PICK));
  await waitFor(() => expect(pickImages).toHaveBeenCalledTimes(2));
});

// ⚠️ **이 시험은 반드시 맨 끝에 둔다.** 「올리는 중에 또 누른다」를 흉내내려면
//    `await` 없이 눌러야 하는데(기다리면 첫 누르기가 끝나 버린다), 그러면 뒷정리가 안 돼
//    **다음 시험의 렌더가 통째로 망가진다.** `unmount()` 로도 안 낫는다 —
//    앞으로 옮기지 마라.
it('올리는 동안에는 다시 못 누른다', async () => {
  // 두 번 누르면 두 장이 올라가고 나중 것이 이긴다 — 어느 쪽이 남을지 알 수 없다.
  //
  // ⚠️ **이 시험만 `await fireEvent` 를 안 쓴다.** 기다리면 첫 누르기의 올리기가 끝날
  //    때까지 멈춰서 두 번째 누르기에 닿지도 못한다(실제로 5초 만에 죽었다).
  //    「올리는 **중**에 또 누른다」를 흉내내려면 안 기다리는 수밖에 없다.
  //    AGENTS.md 의 「셋 다 기다려라」는 **읽는 값이 옛것일까 봐** 두는 규칙인데,
  //    여기서는 값이 아니라 **부른 횟수**를 보므로 그 위험이 없다.
  let 고르기끝내기: (picked: { uri: string }[]) => void = () => {};
  pickImages.mockReturnValue(
    new Promise<{ uri: string }[]>((resolve) => {
      고르기끝내기 = resolve;
    })
  );

  const view = await render(<ProfileImageField url={null} nickname="협주" onChange={jest.fn()} />);
  fireEvent.press(screen.getByTestId(PICK));
  fireEvent.press(screen.getByTestId(PICK));

  expect(pickImages).toHaveBeenCalledTimes(1);

  // ⚠️ **끝내 주고 잠금이 풀리기까지 기다린 다음, 화면을 손수 치운다.**
  //    안 그러면 이 시험이 끝난 뒤에도 올리기가 돌면서 이미 치워진 화면을 건드려
  //    **다음 시험의 렌더가 통째로 망가진다**(실제로 다음 시험이 「표식을 못 찾겠다」로 죽었다).
  //    `await` 없이 누른 대가라 여기서 치러야 한다.
  고르기끝내기([]);
  await waitFor(() =>
    expect(screen.getByTestId(PICK).props.accessibilityState.disabled).toBe(false)
  );
  view.unmount();
});
